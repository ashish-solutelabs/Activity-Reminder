import { forwardRef, Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { TasksModule } from 'src/tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cronscheduler } from './entities/cron.entity';

@Module({
  imports:[forwardRef(() => TasksModule),TypeOrmModule.forFeature([Cronscheduler])],
  controllers: [CronController],
  providers: [CronService],
  exports:[CronService]
})


export class CronModule {}
