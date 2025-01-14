import { EventEmitter2 } from '@nestjs/event-emitter';
import { NoPermissionError } from '@warpy-be/errors';
import { EVENT_PARTICIPANT_KICKED, getMockedInstance } from '@warpy-be/utils';
import { createParticipantFixture } from '@warpy-be/__fixtures__';
import { when } from 'jest-when';
import { ParticipantKickerService, StreamBanStore } from '.';
import { ParticipantService } from '..';
import { BroadcastService } from '../broadcast';
import { ParticipantStore } from '../participant/participant.store';

describe('ParticipantKicker', () => {
  const participantService =
    getMockedInstance<ParticipantService>(ParticipantService);
  const events = getMockedInstance<EventEmitter2>(EventEmitter2);
  const streamBanStore = getMockedInstance<StreamBanStore>(StreamBanStore);
  const broadcastService =
    getMockedInstance<BroadcastService>(BroadcastService);
  const participantStore =
    getMockedInstance<ParticipantStore>(ParticipantStore);

  const service = new ParticipantKickerService(
    participantService as any,
    participantStore as any,
    streamBanStore as any,
    events as any,
    broadcastService as any,
  );

  const kickedUser = 'user0';
  const stream = 'stream0';

  when(streamBanStore.find)
    .calledWith(kickedUser, stream)
    .mockResolvedValue('test' as any);

  const idsOnStream = ['user0', 'user1', 'user2'];
  when(participantStore.getParticipantIds)
    .calledWith(stream)
    .mockResolvedValue(idsOnStream);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks if user has been kicked from stream', async () => {
    expect(service.isUserKicked(kickedUser, stream)).resolves.toBe(true);
  });

  describe('kicking stream participants', () => {
    const mod = createParticipantFixture({
      id: 'kick-mod0',
      role: 'streamer',
      stream,
    });
    const userToKick = createParticipantFixture({ id: 'kick-user0', stream });

    when(participantService.get).calledWith(mod.id).mockResolvedValue(mod);
    when(participantService.get)
      .calledWith(userToKick.id)
      .mockResolvedValue(userToKick);

    it('emits participant kicked event', async () => {
      await service.kickStreamParticipant(userToKick.id, mod.id);

      expect(events.emit).toBeCalledWith(EVENT_PARTICIPANT_KICKED, userToKick);
    });

    it('broadcasts kick user event to other users on stream', async () => {
      await service.kickStreamParticipant(userToKick.id, mod.id);

      expect(broadcastService.broadcast).toBeCalledWith(idsOnStream, {
        event: 'user-kicked',
        data: {
          user: userToKick.id,
          stream: userToKick.stream,
        },
      });
    });

    it('creates stream ban record', async () => {
      await service.kickStreamParticipant(userToKick.id, mod.id);

      expect(streamBanStore.create).toBeCalledWith(
        userToKick.stream,
        userToKick.id,
      );
    });

    it('throws if user and mod are on different streams', async () => {
      const wrongStreamMod = createParticipantFixture({
        id: 'kick-wrongstreammod0',
        role: 'streamer',
        stream: 'stream0',
      });

      const wrongStreamUser = createParticipantFixture({
        id: 'kick-wrongstreamuser0',
        role: 'viewer',
        stream: 'stream1',
      });

      when(participantService.get)
        .calledWith(wrongStreamUser.id)
        .mockResolvedValue(wrongStreamUser);

      when(participantService.get)
        .calledWith(wrongStreamMod.id)
        .mockResolvedValue(wrongStreamMod);

      expect(
        service.kickStreamParticipant(wrongStreamUser.id, wrongStreamMod.id),
      ).rejects.toThrowError(NoPermissionError);
    });

    it("throws error if mod isn't a streamer", async () => {
      const fakeMod = createParticipantFixture({
        id: 'kick-fakemod0',
        role: 'viewer',
      });
      when(participantService.get)
        .calledWith(fakeMod.id)
        .mockResolvedValue(fakeMod);

      expect(
        service.kickStreamParticipant(userToKick.id, fakeMod.id),
      ).rejects.toThrowError(NoPermissionError);
    });
  });
});
