import { BotsModule } from '@backend_2/bots/bots.module';
import { TokenService } from '@backend_2/token/token.service';
import { forwardRef, Module } from '@nestjs/common';
import { BlockModule } from '../block/block.module';
import { MediaModule } from '../media/media.module';
import { MessageModule } from '../message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StreamBlockModule } from '../stream-block/stream-block.module';
import { ParticipantController } from './participant.controller';
import { ParticipantEntity } from './participant.entity';
import { ParticipantService } from './participant.service';

@Module({
  imports: [
    PrismaModule,
    MediaModule,
    StreamBlockModule,
    forwardRef(() => BlockModule),
    BotsModule,
    MessageModule,
    TokenService,
  ],
  providers: [ParticipantService, ParticipantEntity],
  controllers: [ParticipantController],
  exports: [ParticipantService, ParticipantEntity],
})
export class ParticipantModule {}
