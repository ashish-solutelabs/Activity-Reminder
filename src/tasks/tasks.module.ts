import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskRepository } from './task.repository';
import { AuthModule } from '../auth/auth.module';
import { TaskStatusValidationPipe } from './pipes/task-status-validation.pipe';
import { AppModule } from 'src/app.module';
import { TwilioModule } from 'nestjs-twilio';
import { CronModule } from 'src/cron/cron.module';

@Module({
  imports: [
    CronModule,
    TypeOrmModule.forFeature([TaskRepository]),
    AuthModule,
    TaskStatusValidationPipe
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports:[TasksService]
})

export class TasksModule {}
