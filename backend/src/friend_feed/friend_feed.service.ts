import { FollowEntity } from '@backend_2/follow/follow.entity';
import { ParticipantEntity } from '@backend_2/participant/common/participant.entity';
import { StreamEntity } from '@backend_2/stream/stream.entity';
import { Injectable } from '@nestjs/common';
import { IFriendFeedItem } from '@warpy/lib';

@Injectable()
export class FriendFeedService {
  constructor(
    private participant: ParticipantEntity,
    private follow: FollowEntity,
    private stream: StreamEntity,
  ) {}

  async getFriendFeed(user: string): Promise<IFriendFeedItem[]> {
    //Get a list of users we're following
    const following = await this.follow.getFollowedUserIds(user);

    //Check who's participating in rooms
    const participants = await this.participant.getByIds(following, {
      stream: true,
    });

    //Get stream
    const streamIds = [...new Set(participants.map((p) => p.stream))];
    const streams = await this.stream.getByIds(streamIds);

    //Prepare feed
    const feed: IFriendFeedItem[] = participants.map((user) => {
      const stream = streams.find((s) => s.id === user.stream);

      if (stream) {
        user.online = true;
      }

      return {
        user,
        stream,
      };
    });

    console.log({ participants, feed });

    return feed;
  }
}
