import { Participant } from '@warpy/lib';
import { ConfigService } from '@nestjs/config';
import IORedis, { Pipeline } from 'ioredis';
import { flatten } from '@warpy-be/utils/redis';

const PREFIX_VIEWERS = 'viewer_';
const PREFIX_STREAMERS = 'streamers_';
const PREFIX_RAISED_HANDS = 'raised_hands_';
const PREFIX_COUNT = 'count_';
const PREFIX_DEACTIVATED_USERS = 'deactivated_users_';

export function toParticipantDTO(data: any): Participant {
  return {
    ...data,
    videoEnabled: data.videoEnabled === 'true',
    audioEnabled: data.audioEnabled === 'true',
    isRaisingHand: data.isRaisingHand === 'true',
    isBot: data.isBot === 'true',
    isBanned: data.isBanned === 'true',
  };
}

export class ParticipantStore implements ParticipantStore {
  redis: IORedis.Redis;

  constructor(private configService: ConfigService) {}

  onInstanceInit() {
    this.redis = new IORedis(this.configService.get('participantStoreAddr'));
  }

  async isDeactivated(user: string, stream: string) {
    const r = await this.redis.sismember(
      PREFIX_DEACTIVATED_USERS + stream,
      user,
    );

    return r === 1;
  }

  async del(id: string) {
    const pipe = await this.buildDelPipeline(id, {});

    await pipe.exec();
  }

  private async buildDelPipeline(
    id: string,
    {
      pipeline,
      stream: streamOverrideId,
    }: {
      pipeline?: Pipeline;
      stream?: string;
    },
  ) {
    const pipe = pipeline || this.redis.pipeline();

    const stream = streamOverrideId ?? (await this.getStreamId(id));

    pipe.del(id);
    pipe.srem(PREFIX_VIEWERS + stream, id);
    pipe.srem(PREFIX_STREAMERS + stream, id);
    pipe.srem(PREFIX_RAISED_HANDS + stream, id);

    return pipe;
  }

  async get(id: string) {
    const data = await this.redis.hgetall(id);

    return toParticipantDTO(data);
  }

  async delMany(ids: string[]) {
    const pipe = this.redis.pipeline();
    ids.forEach((id) => pipe.del(id));

    await pipe.exec();
  }

  async list(ids: string[]): Promise<Participant[]> {
    const pipe = this.redis.pipeline();

    for (const id of ids) {
      pipe.hgetall(id);
    }

    const data = await pipe.exec();
    const result = data
      .map(([, data]) => {
        if (Object.keys(data).length === 0) {
          return null;
        }

        return toParticipantDTO(data);
      })
      .filter((item) => !!item);

    return result;
  }

  /**
   * Enable/disable participant
   * (start/stop including this user when fetching lists, etc)
   * */
  async setDeactivated(user: string, stream: string, flag: boolean) {
    if (flag) {
      await this.redis
        .pipeline()
        .sadd(PREFIX_DEACTIVATED_USERS + stream, user)
        .decr(PREFIX_COUNT + stream)
        .exec();
    } else {
      await this.redis
        .pipeline()
        .srem(PREFIX_DEACTIVATED_USERS + stream, user)
        .incr(PREFIX_COUNT + stream)
        .exec();
    }
  }

  async getStreamId(user: string) {
    return this.redis.hget(user, 'stream');
  }

  async countVideoStreamers(stream: string) {
    const ids = await this.redis.sdiff(
      PREFIX_STREAMERS + stream,
      PREFIX_DEACTIVATED_USERS + stream,
    );

    const streamers = await this.list(ids);

    return streamers.reduce((p, s) => {
      return s.videoEnabled ? p + 1 : p;
    }, 0);
  }

  async getParticipantIds(stream: string, includeDeactivatedUsers = false) {
    const deactivatedUserIdsKey = PREFIX_DEACTIVATED_USERS + stream;

    const pipe = this.redis.pipeline();
    if (includeDeactivatedUsers) {
      pipe.smembers(PREFIX_STREAMERS + stream);
      pipe.smembers(PREFIX_RAISED_HANDS + stream);
      pipe.smembers(PREFIX_VIEWERS + stream);
    } else {
      pipe.sdiff(PREFIX_STREAMERS + stream, deactivatedUserIdsKey);
      pipe.sdiff(PREFIX_RAISED_HANDS + stream, deactivatedUserIdsKey);
      pipe.sdiff(PREFIX_VIEWERS + stream, deactivatedUserIdsKey);
    }

    const [[, streamers], [, raisedHands], [, viewers]] = await pipe.exec();
    const ids: string[] = [...streamers, ...raisedHands, ...viewers];

    return ids;
  }

  async removeParticipantDataFromStream(stream: string) {
    const ids = await this.getParticipantIds(stream, true);

    if (ids.length === 0) {
      return;
    }

    const pipeline = this.redis.pipeline();

    //Delete indexes
    pipeline.del(PREFIX_STREAMERS + stream);
    pipeline.del(PREFIX_VIEWERS + stream);
    pipeline.del(PREFIX_RAISED_HANDS + stream);
    pipeline.del(PREFIX_DEACTIVATED_USERS + stream);

    //Delete participant count
    pipeline.del(PREFIX_COUNT + stream);

    //Delete records
    ids.forEach((id) => pipeline.del(id));

    await pipeline.exec();
  }

  async removeParticipantFromStream(participant: string, stream: string) {
    await this.redis
      .pipeline()
      .srem(PREFIX_STREAMERS + stream, participant)
      .srem(PREFIX_VIEWERS + stream, participant)
      .srem(PREFIX_RAISED_HANDS + stream, participant)
      .srem(PREFIX_DEACTIVATED_USERS + stream, participant)
      .del(participant)
      .exec();
  }

  /**
   * Returns info about audio/video streamers
   * */
  async getStreamers(stream: string) {
    const ids = await this.redis.sdiff(
      PREFIX_STREAMERS + stream,
      PREFIX_DEACTIVATED_USERS + stream,
    );

    return this.list(ids);
  }

  /**
   * Returns info about participants with raised hands
   * */
  async getRaisedHands(stream: string) {
    const ids = await this.redis.sdiff(
      PREFIX_RAISED_HANDS + stream,
      PREFIX_DEACTIVATED_USERS + stream,
    );

    return this.list(ids);
  }

  async count(stream: string) {
    const v = await this.redis.get(PREFIX_COUNT + stream);

    return v ? Number.parseInt(v) : 0;
  }

  private async write(
    key: string,
    data: Partial<Participant>,
    pipeline?: Pipeline,
  ) {
    const args = flatten(data);

    return (pipeline || this.redis).hmset(key, ...args);
  }

  async update(id: string, data: Partial<Participant>) {
    const pipe = this.redis.pipeline();
    this.write(id, data, pipe);
    pipe.hgetall(id);

    const stream = data.stream ?? (await this.redis.hget(id, 'stream'));

    //update indexes if user's role has changed
    const { role } = data;

    if (role === 'speaker' || role === 'streamer') {
      pipe.sadd(PREFIX_STREAMERS + stream, id);
      pipe.srem(PREFIX_VIEWERS + stream, id);
      pipe.srem(PREFIX_RAISED_HANDS + stream, id);
    } else if (role === 'viewer') {
      pipe.sadd(PREFIX_VIEWERS + stream, id);
      pipe.srem(PREFIX_STREAMERS + stream, id);
      pipe.srem(PREFIX_RAISED_HANDS + stream, id);
    }

    //update indexes if user has raised/lowered their hand
    if (typeof data.isRaisingHand !== 'undefined') {
      if (data.isRaisingHand) {
        pipe.sadd(PREFIX_RAISED_HANDS + stream, id);
        pipe.srem(PREFIX_VIEWERS + stream, id);
      } else {
        pipe.srem(PREFIX_RAISED_HANDS + stream, id);
        pipe.sadd(PREFIX_VIEWERS + stream, id);
      }
    }

    const [, [, updated]] = await pipe.exec();

    return toParticipantDTO(updated);
  }

  async getViewersPage(stream: string, page: number) {
    const all_ids = await this.redis.sdiff(
      PREFIX_VIEWERS + stream,
      PREFIX_DEACTIVATED_USERS,
    );
    const ids = all_ids.slice(page * 50, (page + 1) * 50);

    return this.list(ids);
  }

  async add(data: Participant) {
    const { stream, id } = data;

    const pipe = this.redis.pipeline();

    //Clear previous participant data for this user
    const existing = await this.get(id);
    if (existing) {
      await this.removeParticipantFromStream(existing.id, existing.stream);
    }

    if (data.role === 'viewer') {
      pipe.sadd(PREFIX_VIEWERS + stream, id);
    } else {
      pipe.sadd(PREFIX_STREAMERS + stream, id);
    }

    pipe.incr(PREFIX_COUNT + stream);
    this.write(data.id, data, pipe);

    await pipe.exec();
  }
}
