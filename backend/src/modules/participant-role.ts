import { Controller, Injectable, Module } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MessagePattern } from '@nestjs/microservices';
import { OnHostReassign } from '@warpy-be/interfaces';
import { EVENT_HOST_REASSIGN } from '@warpy-be/utils';
import { ParticipantRoleManagerService } from 'lib';
import { ISetRoleRequest } from '@warpy/lib';
import { NjsParticipantStore } from './participant';
import { NjsUserBlockService, UserBlockModule } from './user-block';
import { NjsMessageService } from './message';
import { MediaModule, NjsMediaService } from './media';
import { HostModule, NjsHostService } from './stream-host';

@Injectable()
export class NjsParticipantRoleService extends ParticipantRoleManagerService {
  constructor(
    participantStore: NjsParticipantStore,
    userBlockService: NjsUserBlockService,
    messageService: NjsMessageService,
    mediaService: NjsMediaService,
    events: EventEmitter2,
    hostService: NjsHostService,
  ) {
    super(
      participantStore,
      userBlockService,
      messageService,
      mediaService,
      events,
      hostService,
    );
  }
}

@Controller()
export class ParticipantRoleController implements OnHostReassign {
  constructor(private role: NjsParticipantRoleService) {}

  @OnEvent(EVENT_HOST_REASSIGN)
  async onHostReassign({ host }) {
    return this.role.setRole({
      userToUpdate: host.id,
      role: 'streamer',
      stream: host.stream,
    });
  }

  @MessagePattern('participant.set-role')
  async onSetRole({ user, userToUpdate, role }: ISetRoleRequest) {
    await this.role.setRole({
      userToUpdate,
      role,
      mod: user,
    });
  }
}

@Module({
  imports: [UserBlockModule, HostModule, MediaModule],
  providers: [NjsParticipantRoleService],
  controllers: [ParticipantRoleController],
  exports: [NjsParticipantRoleService],
})
export class ParticipantRoleModule {}
