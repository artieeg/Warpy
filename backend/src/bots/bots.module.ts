import { DeveloperAccountModule } from '@backend_2/developer_account/developer_account.module';
import { MediaModule } from '@backend_2/media/media.module';
import { MessageModule } from '@backend_2/message/message.module';
import { ParticipantModule } from '@backend_2/participant/participant.module';
import { PrismaModule } from '@backend_2/prisma/prisma.module';
import { TokenModule } from '@backend_2/token/token.module';
import { forwardRef, Module } from '@nestjs/common';
import { BotInstanceController } from './bot-instance.controller';
import { BotInstanceEntity } from './bot-instance.entity';
import { BotInstanceService } from './bot-instance.service';
import { BotsController } from './bots.controller';
import { BotsEntity } from './bots.entity';
import { BotsService } from './bots.service';

@Module({
  imports: [
    PrismaModule,
    MediaModule,
    forwardRef(() => ParticipantModule),
    DeveloperAccountModule,
    MessageModule,
    TokenModule,
  ],
  providers: [BotsService, BotInstanceService, BotInstanceEntity, BotsEntity],
  controllers: [BotInstanceController, BotsController],
  exports: [BotsEntity, BotInstanceEntity],
})
export class BotsModule {}