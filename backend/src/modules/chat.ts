import { Injectable, Controller, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagePattern } from '@nestjs/microservices';
import { UserModule } from './user';
import { ChatService, ParticipantService } from '@warpy-be/app';
import { RequestSendChatMessage, SendMessageResponse } from '@warpy/lib';
import { NjsParticipantService, NjsParticipantStore } from './participant';
import { NjsUserBlockService, UserBlockModule } from './user-block';
import { NjsBroadcastService } from './broadcast';

@Injectable()
export class NjsChatService extends ChatService {
  constructor(
    events: EventEmitter2,
    participantService: NjsParticipantService,
    participantStore: NjsParticipantStore,
    userBlockService: NjsUserBlockService,
    broadcastService: NjsBroadcastService,
  ) {
    super(
      events,
      participantService,
      participantStore,
      userBlockService,
      broadcastService,
    );
  }
}

@Controller()
export class ChatController {
  constructor(private chatService: NjsChatService) {}

  @MessagePattern('stream.new-chat-message')
  async onNewChatMessage({
    user,
    message,
  }: RequestSendChatMessage): Promise<SendMessageResponse> {
    try {
      const newChatMessage = await this.chatService.sendNewMessage(
        user,
        message,
      );

      return { message: newChatMessage };
    } catch (e) {
      console.error(e);
    }
  }
}

@Module({
  imports: [EventEmitter2, UserBlockModule, ParticipantService, UserModule],
  providers: [NjsChatService],
  controllers: [ChatController],
  exports: [],
})
export class ChatModule {}
