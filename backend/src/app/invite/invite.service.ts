import { NoPermissionError } from '@warpy-be/errors';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invite, InviteStates, EventReceivedInvite, User } from '@warpy/lib';
import { EVENT_INVITE_AVAILABLE } from '@warpy-be/utils';
import {
  UserStore,
  StreamStore,
  MessageService,
  TokenService,
  BotStore,
} from '@warpy-be/app';
import { FollowStore } from '@warpy-be/app/follow/follow.store';
import { InviteStore } from './invite.store';

export class InviteService {
  constructor(
    private inviteStore: InviteStore,
    private userStore: UserStore,
    private followStore: FollowStore,
    private events: EventEmitter2,
    private streamStore: StreamStore,
    private messageService: MessageService,
    private tokenService: TokenService,
    private botStore: BotStore,
  ) {}

  /**
   * Sends invite updates to the user-inviter;
   * Notifies when invited user has accepted or declined the invite
   * */
  private sendInviteState(id: string, inviter: string, state: InviteStates) {
    this.messageService.sendMessage(inviter, {
      event: 'invite-state-update',
      data: {
        id,
        state,
      },
    });
  }

  /**
   * Declines the invite and notifies the inviter
   * */
  async declineInvite(invite: string) {
    const { id, inviter_id } = await this.inviteStore.del(invite);

    this.sendInviteState(id, inviter_id, 'declined');
  }

  async checkNewInvitesFor(user: string) {
    const invites = await this.inviteStore.getPendingInvitesFor(user);

    //Emit notifications about each new invite to streams that have already started
    invites
      .filter((invite) => invite.stream_id)
      .forEach((invite) => this.events.emit(EVENT_INVITE_AVAILABLE, invite));

    const latestInvite = invites[invites.length - 1];

    //send the latest invite
    if (latestInvite) {
      this.messageService.sendMessage(user, {
        event: 'new-invite',
        data: {
          invite: latestInvite,
        },
      });
    }

    //Mark invites as received
    this.inviteStore.updateMany(
      invites.map((invite) => invite.id),
      { received: true },
    );
  }

  async deleteUserInvites(user: string) {
    const ids = await this.inviteStore.getUserInviteIds(user);
    await Promise.all(ids.map((id) => this.inviteStore.del(id)));
  }

  /**
   * Accepts the invite and notifies the inviter
   * */
  async acceptInvite(invite_id: string) {
    const { id, inviter_id, stream_id } = await this.inviteStore.get(invite_id);

    //if stream has already started, delete the invite from store
    if (stream_id) {
      await this.inviteStore.del(invite_id);
    }

    this.sendInviteState(id, inviter_id, 'accepted');
  }

  /**
   * Handles inviting real user
   * Creates invite record and sends a notification
   * */
  private async inviteRealUser(
    inviter_id: string,
    invitee_id: string,
    stream_id?: string,
  ) {
    const [inviter, invitee, stream] = await Promise.all([
      this.userStore.find(inviter_id),
      this.userStore.find(invitee_id),
      stream_id && this.streamStore.findById(stream_id),
    ]);

    //If the receiver is online, mark the invitation as received
    //else, invitation will be marked as not received and
    //will be sent out once the user has opened the app
    const isInviteeOnline = await this.inviteStore.isUserOnline(invitee.id);

    const invite = await this.inviteStore.create({
      invitee,
      inviter,
      stream,
      received: isInviteeOnline,
    });

    this.events.emit(EVENT_INVITE_AVAILABLE, invite);
    this.messageService.sendMessage(invitee.id, {
      event: 'new-invite',
      data: {
        invite,
      } as EventReceivedInvite,
    });

    return invite;
  }

  /**
   * Handles inviting bots
   * Creates permission token to join the stream and sends it to a bot
   * */
  private async inviteBotUser(inviter: string, bot: string, streamId: string) {
    const stream = await this.streamStore.findById(streamId);

    if (stream.owner !== inviter) {
      throw new NoPermissionError();
    }

    const inviteDetailsToken = this.tokenService.createToken(
      {
        stream: streamId,
      },
      { expiresIn: '5m' },
    );

    this.messageService.sendMessage(bot, {
      event: 'bot-invite',
      data: {
        stream: streamId,
        inviteDetailsToken,
      },
    });
  }

  async createStreamInvite({
    inviter,
    stream,
    invitee,
  }: {
    inviter: string;
    stream: string;
    invitee: string;
  }): Promise<Invite | null> {
    const isBot = invitee.slice(0, 3) === 'bot';

    if (isBot) {
      await this.inviteBotUser(inviter, invitee, stream);

      return null;
    } else {
      const invite = await this.inviteRealUser(inviter, invitee, stream);

      return invite;
    }
  }

  /**
   * Listens to new streams
   * When new stream is created, checks if new stream's owner has invited others
   * Then it broadcasts stream's id to invited users
   * */
  async notifyAboutStreamId(id: string, owner: string) {
    const [stream, ownedInviteIds] = await Promise.all([
      this.streamStore.findById(id),
      this.inviteStore.getUserInviteIds(owner),
    ]);

    const [invitedUserIds] = await Promise.all([
      this.inviteStore.getInvitedUsers(ownedInviteIds),
      this.inviteStore.setStreamData(ownedInviteIds, stream),
    ]);

    invitedUserIds.forEach((user) => {
      this.messageService.sendMessage(user, {
        event: 'stream-id-available',
        data: {
          id,
        },
      });
    });
  }

  async deleteInvite(invite_id: string) {
    await this.inviteStore.del(invite_id);
  }

  /**
   * Creates invite suggestions from bots, followers, following
   * */
  async getInviteSuggestions(user: string, _stream: string): Promise<User[]> {
    const [followed, following, bots] = await Promise.all([
      this.followStore.getFollowed(user),
      this.followStore.getFollowers(user),
      this.botStore.getMany(),
    ]);

    const suggestions: User[] = [
      ...followed.map((f) => f.followed as User),
      ...following.map((f) => f.follower as User),
    ];

    for (var i = suggestions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = suggestions[i];
      suggestions[i] = suggestions[j];
      suggestions[j] = temp;
    }

    const uniqueSuggestionMap = new Map<string, User>(
      suggestions.map((user) => [user.id, user]),
    );

    return [...bots, ...Array.from(uniqueSuggestionMap.values())];
  }
}
