import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RequestFetchFriendFeed } from '@warpy/lib';
import { FriendFeedService } from '@warpy-be/app';
import { FollowModule, NjsFollowStore } from './follow';
import { NjsParticipantStore } from './participant';
import { NjsStreamStore, StreamModule } from './stream';
import { UserModule } from './user';

@Injectable()
export class NjsFriendFeedService extends FriendFeedService {
  constructor(
    participantStore: NjsParticipantStore,
    followStore: NjsFollowStore,
    streamStore: NjsStreamStore,
  ) {
    super(participantStore, followStore, streamStore);
  }
}

@Controller()
export class FriendFeedController {
  constructor(private friendFeedService: NjsFriendFeedService) {}

  @MessagePattern('friend-feed.get')
  async onGetFriendFeed({ user }: RequestFetchFriendFeed) {
    const feed = await this.friendFeedService.getFriendFeed(user);

    return { feed };
  }
}

@Module({
  imports: [UserModule, FollowModule, StreamModule],
  providers: [NjsFriendFeedService],
  controllers: [FriendFeedController],
  exports: [NjsFriendFeedService],
})
export class FriendFeedModule {}