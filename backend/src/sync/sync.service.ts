import { Injectable } from '@nestjs/common';
import { NjsCategoryStore } from '@warpy-be/categories/categories.entity';
import { UserNotFound } from '@warpy-be/errors';
import { NjsFriendFeedService } from '@warpy-be/friend_feed/friend_feed.service';
import { UserListService } from '@warpy-be/user-list/user-list.service';
import { AppliedAppInviteEntity } from '@warpy-be/user/app_invite/applied-app-invite.entity';
import { NjsUserService } from '@warpy-be/user/user.service';
import { IWhoAmIResponse } from '@warpy/lib';

@Injectable()
export class SyncService {
  constructor(
    private userService: NjsUserService,
    private appliedAppInviteEntity: AppliedAppInviteEntity,
    private categoriesEntity: NjsCategoryStore,
    private friendFeed: NjsFriendFeedService,
    private userListService: UserListService,
  ) {}

  async sync(user: string): Promise<IWhoAmIResponse> {
    const [data, hasActivatedAppInvite, categories, friendFeed, following] =
      await Promise.all([
        this.userService.findById(user, true),
        this.appliedAppInviteEntity.find(user),
        this.categoriesEntity.getAll(),
        this.friendFeed.getFriendFeed(user),
        this.userListService.getFollowing(user, 0),
      ]);

    if (!data) {
      throw new UserNotFound();
    }

    return {
      user: data,
      following,
      friendFeed,
      hasActivatedAppInvite: !!hasActivatedAppInvite,
      categories,
    };
  }
}
