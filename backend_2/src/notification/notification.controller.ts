import { Controller } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessagePattern } from '@nestjs/microservices';
import {
  IGetReadNotifications,
  IGetUnreadNotifications,
  IInvite,
  INotificationsPage,
  IReadNotifications,
} from '@warpy/lib';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @OnEvent('notification.invite.create')
  async onNewInvite(invite: IInvite) {
    await this.notificationService.createInviteNotification(invite);
  }

  @OnEvent('notification.cancel')
  async onNotificationCancel(id: string) {
    await this.notificationService.cancelNotification(id);
  }

  @MessagePattern('notifications.read')
  async onNotificationsRead({ user }: IReadNotifications) {
    await this.notificationService.readAllNotifications(user);
  }

  @MessagePattern('notifications.get-read')
  async onGetReadNotifications({
    user,
    page,
  }: IGetReadNotifications): Promise<INotificationsPage> {
    const notifications = await this.notificationService.getReadNotifications(
      user,
      page,
    );

    return {
      notifications,
    };
  }

  @MessagePattern('notifications.get-unread')
  async onGetUnreadNotifications({
    user,
  }: IGetUnreadNotifications): Promise<INotificationsPage> {
    const notifications = await this.notificationService.getUnreadNotifications(
      user,
    );

    return {
      notifications,
    };
  }
}