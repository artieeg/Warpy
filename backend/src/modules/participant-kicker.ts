import { Controller, Injectable, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagePattern } from '@nestjs/microservices';
import {
  ParticipantKickerService,
  StreamBanStore,
} from '@warpy-be/app/participant-kicker';
import { RequestKickUser } from '@warpy/lib';
import { NjsBroadcastService } from './broadcast';
import {
  NjsParticipantService,
  NjsParticipantStore,
  ParticipantModule,
} from './participant';
import { PrismaModule, PrismaService } from './prisma';

@Injectable()
export class NjsStreamBanStore extends StreamBanStore {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}

@Injectable()
export class NjsParticipantKickerService extends ParticipantKickerService {
  constructor(
    participantService: NjsParticipantService,
    participantStore: NjsParticipantStore,
    streamBanStore: NjsStreamBanStore,
    events: EventEmitter2,
    broadcastService: NjsBroadcastService,
  ) {
    super(
      participantService,
      participantStore,
      streamBanStore,
      events,
      broadcastService,
    );
  }
}

@Controller()
export class ParticipantKickerController {
  constructor(private kicker: NjsParticipantKickerService) {}

  @MessagePattern('stream.kick-user')
  async onKickUser({ userToKick, user }: RequestKickUser) {
    await this.kicker.kickStreamParticipant(userToKick, user);
  }
}

@Module({
  imports: [PrismaModule, ParticipantModule],
  providers: [NjsParticipantKickerService, NjsStreamBanStore],
  controllers: [ParticipantKickerController],
  exports: [NjsParticipantKickerService],
})
export class ParticipantKickerModule {}
