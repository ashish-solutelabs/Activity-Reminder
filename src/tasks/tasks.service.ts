import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(TaskRepository) private taskRepository: TaskRepository 
    ) {}
    private logger = new Logger('TaskService');


    @Cron(CronExpression.EVERY_30_SECONDS,{
        name: 'notifications',
        timeZone: 'Asia/Kolkata'
    })
    async handleCron() {
        const taskList = await this.taskRepository.find()
        if (taskList) {
            const now  = new Date()
            console.log(now)
            for(let taskdata of taskList){
                let remindTime = new Date(taskdata.remindAt)
                       
                if((now.toLocaleDateString()===remindTime.toLocaleDateString()) && (now.getHours()===remindTime.getHours())&&(remindTime.getMinutes()===now.getMinutes()))
                {
                    const accountSid = 'AC0028c56f3e02c49da627e11420474a3f'; 
                    const authToken = '60b4360f238a8e28d72d23517b631c87'; 
                    const client = require('twilio')(accountSid, authToken); 
                    const remindMsg = `title:${taskdata.title}\ndesc:${taskdata.description}`
                    const status = await client.messages.create({ 
                            body: remindMsg, 
                            from: 'whatsapp:+14155238886',       
                            to: 'whatsapp:+917285868035' 
                        }) 
                        .then((message: { sid: any; }) => this.logger.verbose(`sent massage id: "${message.sid}" `)) 
                        .done();
                    taskdata.status = TaskStatus.DONE
                    try {
                        await taskdata.save();
                    } catch (error) {
                            this.logger.error(`Failed to update status ${taskdata.id} `, error.stack);
                            throw new InternalServerErrorException();
                    }
                }
            }
        }
    }
    
    async getTasks(
        filterDto: GetTasksFilterDto,
        user: User,
    ): Promise<Task[]> {
        return this.taskRepository.getTasks(filterDto, user);
    }

    async getTaskById(
        id: number,
        user: User,
    ): Promise<Task> {
        const found = await this.taskRepository.findOne({ where: { id, userId: user.id } });

        if (!found) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }

        return found;
    }

    async createTask(
        createTaskDto: CreateTaskDto,
        user: User,
    ): Promise<Task> {
        return this.taskRepository.createTask(createTaskDto, user);
    }

    async deleteTask(
        id: number,
        user: User,
    ): Promise<void> {
        const result = await this.taskRepository.delete({ id, userId: user.id });
        if (result.affected === 0) {
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }
    }

    async updateTaskStatus(
        id: number,
        status: TaskStatus,
        user: User,
    ): Promise<Task> {
        const task = await this.getTaskById(id, user);
        task.status = status;
        await task.save();
        return task;
    }
}
