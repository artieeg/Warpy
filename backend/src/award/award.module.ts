import { PrismaModule } from '@backend_2/prisma/prisma.module';
import { UserModule } from '@backend_2/user/user.module';
import { Module } from '@nestjs/common';
import { AwardController } from './award.controller';
import { AwardEntity } from './award.entity';
import { AwardService } from './award.service';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [AwardService, AwardEntity],
  controllers: [AwardController],
  exports: [],
})
export class AwardModule {}
