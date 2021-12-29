import { AppInviteModule } from '@backend_2/app_invite/app-invite.module';
import { AwardModule } from '@backend_2/award/award.module';
import { BlockModule } from '@backend_2/block/block.module';
import { BotsModule } from '@backend_2/bots/bots.module';
import { BroadcastModule } from '@backend_2/broadcast/broadcast.module';
import { CategoryModule } from '@backend_2/categories/categories.module';
import { ChatModule } from '@backend_2/chat/chat.module';
import { CoinBalanceModule } from '@backend_2/coin-balance/coin-balance.module';
import { configuration } from '@backend_2/config/configuration';
import { DeveloperAccountModule } from '@backend_2/developer_account/developer_account.module';
import { FeedModule } from '@backend_2/feed/feed.module';
import { FollowModule } from '@backend_2/follow/follow.module';
import { FriendFeedModule } from '@backend_2/friend_feed/friend_feed.module';
import { InviteModule } from '@backend_2/invite/invite.module';
import { MediaModule } from '@backend_2/media/media.module';
import { MessageModule } from '@backend_2/message/message.module';
import { NatsModule } from '@backend_2/nats/nats.module';
import { NotificationModule } from '@backend_2/notification/notification.module';
import { ParticipantModule } from '@backend_2/participant/participant.module';
import { ReactionModule } from '@backend_2/reaction/reaction.module';
import { StreamBlockModule } from '@backend_2/stream-block/stream-block.module';
import { StreamModule } from '@backend_2/stream/stream.module';
import { UserReportModule } from '@backend_2/user-report/user-report.module';
import { UserModule } from '@backend_2/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';

export const testModuleBuilder = Test.createTestingModule({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    CategoryModule,
    BotsModule,
    FriendFeedModule,
    AwardModule,
    CoinBalanceModule,
    DeveloperAccountModule,
    FeedModule,
    UserModule,
    StreamModule,
    MessageModule,
    AppInviteModule,
    UserReportModule,
    MediaModule,
    StreamModule,
    StreamBlockModule,
    NatsModule,
    ParticipantModule,
    BlockModule,
    InviteModule,
    ChatModule,
    BroadcastModule,
    ReactionModule,
    FollowModule,
    NotificationModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
});
