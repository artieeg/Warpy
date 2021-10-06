import { MessageService } from '@backend_2/message/message.service';
import { Injectable } from '@nestjs/common';
import { IInvite } from '@warpy/lib';
import { NotificationEntity } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    private notificationEntity: NotificationEntity,
    private messageService: MessageService,
  ) {}

  async createInviteNotification(invite: IInvite) {
    const notification = await this.notificationEntity.createFromInvite(
      invite.invitee.id,
      invite.id,
    );

    const { invitee } = invite;
    const { id } = invitee;

    this.messageService.sendMessage(id, {
      event: 'notification',
      data: {
        notification,
      },
    });
  }

  async readAllNotifications(user_id: string) {
    await this.notificationEntity.readAll(user_id);
  }

  async getUnreadNotifications(user: string) {
    return this.notificationEntity.getUnread(user);
  }

  async getReadNotifications(user: string, page: number) {
    return this.notificationEntity.getAll(user, page);
  }

  async cancelNotification(notification_id: string) {
    const notification = await this.notificationEntity.getById(notification_id);

    this.messageService.sendMessage(notification.user_id, {
      event: 'notification-deleted',
      data: {
        notification_id,
      },
    });
  }

  async sendNewFollowNofification(followedUser: string, follower: string) {
    throw new Error('unimplemented');
  }
}