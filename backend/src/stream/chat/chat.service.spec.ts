import { BlockEntity } from '@warpy-be/block/block.entity';
import { mockedBlockEntity } from '@warpy-be/block/block.entity.mock';
import { StreamNotFound, UserNotFound } from '@warpy-be/errors';
import { mockedEventEmitter } from '@warpy-be/events/events.service.mock';
import { ParticipantEntity } from '@warpy-be/participant/participant.entity';
import { mockedParticipantEntity } from '@warpy-be/participant/participant.entity.mock';
import { UserEntity } from '@warpy-be/user/user.entity';
import { mockedUserEntity } from '@warpy-be/user/user.entity.mock';
import { createUserFixture } from '@warpy-be/__fixtures__';
import { testModuleBuilder } from '@warpy-be/__fixtures__/app.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeAll(async () => {
    const m = await testModuleBuilder
      .overrideProvider(EventEmitter2)
      .useValue(mockedEventEmitter)
      .overrideProvider(UserEntity)
      .useValue(mockedUserEntity)
      .overrideProvider(ParticipantEntity)
      .useValue(mockedParticipantEntity)
      .overrideProvider(BlockEntity)
      .useValue(mockedBlockEntity)
      .compile();

    chatService = m.get(ChatService);
  });

  it('throws an error if sender does not exist', async () => {
    mockedUserEntity.findById.mockResolvedValueOnce(null);

    expect(
      chatService.sendNewMessage('test-id', 'test message'),
    ).rejects.toThrowError(UserNotFound);
  });

  it('throws an error if stream does not exist', async () => {
    const sender = createUserFixture({});
    mockedUserEntity.findById.mockResolvedValueOnce(sender);

    mockedParticipantEntity.getCurrentStreamFor.mockResolvedValueOnce(null);
    expect(
      chatService.sendNewMessage('test-id', 'test message'),
    ).rejects.toThrowError(StreamNotFound);
  });

  it('sends a message', async () => {
    const sender = createUserFixture({});
    const stream = 'test-stream-id';
    const participantIds = ['id1', 'id2', 'id3'];
    const blockedBy = ['id1'];
    const blocked = ['id2'];
    const message = 'test message';

    mockedParticipantEntity.getCurrentStreamFor.mockResolvedValueOnce(stream);
    mockedUserEntity.findById.mockResolvedValue(sender);
    mockedParticipantEntity.getIdsByStream.mockResolvedValueOnce(
      participantIds,
    );
    mockedBlockEntity.getBlockedByIds.mockResolvedValue(blockedBy);
    mockedBlockEntity.getBlockedUserIds.mockResolvedValue(blocked);

    await chatService.sendNewMessage('test-id', 'test message');

    expect(mockedEventEmitter.emit).toHaveBeenCalledWith('chat.message', {
      idsToBroadcast: ['id3'],
      message: expect.objectContaining({
        sender,
        message,
      }),
    });
  });
});
