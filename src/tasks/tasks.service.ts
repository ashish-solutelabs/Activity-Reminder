import { forwardRef, Inject, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { CronService } from 'src/cron/cron.service';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(TaskRepository) private taskRepository: TaskRepository,
        @Inject(forwardRef(() => CronService)) private cronService: CronService) {}

    private logger = new Logger('TaskService');
    
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
        const status= await this.taskRepository.createTask(createTaskDto, user);

        const crontask = {
            reminderMassage:`title:${status.title}\ndesc:${status.description}`,
            phoneNumber:user.phoneNummber,
            email:user.email,
            status:TaskStatus.OPEN,
            remindAt:status.remindAt,
            task:status
        }

        await this.cronService.create(crontask)
        return status
    }

    async deleteTask(
        id: number,
        user: User,
    ): Promise<void> {
        const task = await this.getTaskById(id, user);

        if(task){
            await this.cronService.remove(id)
        }
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
        const taskinfo=await task.save();

        if(!taskinfo){
            throw new NotAcceptableException("Data is not store in server");
        }
        await this.cronService.update(taskinfo.id,taskinfo)

        return task;
    }

    async updateTask(id:number,updateTaskDto,user:User){
        const task = await this.getTaskById(id, user);
        Object.assign(task,updateTaskDto)
        const taskinfo=await task.save()

        if(!taskinfo){
            throw new NotAcceptableException("Data is not store in server");
        }
        
        await this.cronService.update(taskinfo.id,taskinfo)
        return taskinfo
    }

    async updateCronStatus(id:number){
        console.log(id)
    }
}
