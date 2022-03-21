import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwilioModule } from 'nestjs-twilio';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { Task } from './tasks/task.entity';
import { TasksModule } from './tasks/tasks.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DATABASE_HOST, 
    port: +process.env.DATABASE_PORT, 
    username: process.env.DATABASE_USER, 
    password: process.env.DATABASE_PASSWORD, 
    database: process.env.DATABASE_NAME,
    entities: [Task,User], 
    synchronize: true,
  }),TasksModule,AuthModule],
})

export class AppModule {}
