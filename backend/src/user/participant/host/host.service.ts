import { Injectable } from '@nestjs/common';
import { TimerService } from '@warpy-be/shared';
import { IFullParticipant } from '../store';
import { HostStore } from './host.store';

@Injectable()
export class HostService {
  constructor(
    private timerService: TimerService,
    private hostStore: HostStore,
  ) {}

  async handlePossibleHost({ role, stream, id }: IFullParticipant) {
    //If user has been downgraded to viewer, remove him from the list
    if (role === 'viewer') {
      return this.hostStore.delPossibleHost(stream, id);
    }

    return this.hostStore.addPossibleHost(stream, id);
  }

  async handleRejoinedUser(user: string) {
    const host = await this.hostStore.getHostInfo(user);

    if (!host) {
      return;
    }

    return this.hostStore.setHostJoinedStatus(user, true);
  }

  async assignHost(stream: string, newHostId: string) {
    //TODO
  }

  /**
   * checks if user is a host and is disconnected
   * waits for 15 seconds, if user failed to reconnect, reassings host
   * */
  async tryReassignHostAfterTime(user: string) {
    const host = await this.hostStore.getHostInfo(user);

    //If user is not host
    if (!host) {
      return;
    }

    //make user offline
    await this.hostStore.setHostJoinedStatus(user, false);

    //wait 15 seconds and check if the host has reconnected
    this.timerService.setTimer(async () => {
      const hostHasRejoined = await this.hostStore.isHostJoined(user);

      //if the user has rejoined, don't do anything else
      if (hostHasRejoined) {
        return;
      }

      //fetch new host suggestion & delete previous host record
      const [newHostId] = await Promise.all([
        this.hostStore.getRandomPossibleHost(host.stream),
        this.hostStore.delByStream(host.stream),
      ]);

      if (!newHostId) {
        return; //can't assign a new host, TODO: emit
      }

      await this.assignHost(host.stream, newHostId);
    }, 15000);
  }
}
