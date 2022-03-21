import { Repository, EntityRepository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../auth/user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
    private logger = new Logger('TaskRepository');
    async getTasks(
        filterDto: GetTasksFilterDto,
        user: User,
        ): Promise<Task[]> {
        const { status, search } = filterDto;
        const query = this.createQueryBuilder('task');

        query.where('task.user = :userId', { userId: user.id });

        if (status) {
            query.andWhere('task.status = :status', { status });
        }

        if (search) {
            query.andWhere('(task.title LIKE :search OR task.description LIKE :search)', { search: `%${search}%` });
        }

        try {
            const tasks = await query.getMany();
            return tasks;
        } catch (error) {
            this.logger.error(`Failed to get tasks for user "${user.username}", Filters: ${JSON.stringify(filterDto)}`, error.stack);
            throw new InternalServerErrorException();
        }
    }

    async createTask(
        createTaskDto: CreateTaskDto,
        user: User,
    ): Promise<Task> {
        const { title, description,remindAt } = createTaskDto;
        const task = new Task();
        task.title = title;
        task.description = description;
        task.status = TaskStatus.OPEN;
        task.remindAt = remindAt
        task.user = user;
        try {
            await task.save();
        } catch (error) {
            this.logger.error(`Failed to create a task for user "${user.username}". Data: ${JSON.stringify(createTaskDto)}`, error.stack);
            throw new InternalServerErrorException();
        }

        delete task.user;
        return task;
    }

    async find(){
        const query = this.createQueryBuilder('task');
        query.andWhere('task.status = :status', { status:"OPEN" });
        const tasklist  = await query.getMany();
        return tasklist
    }
    // async updateTask(id:number,status: TaskStatus,user:User){
    //     const query = this.createQueryBuilder('task');
    //     query.where('task.user = :userId AND task.id =:id', { userId: user.id,id });
    //     let task = await query.getOne();
    //     task.status = status
    //     try {
    //         await task.save();
    //     } catch (error) {
    //         this.logger.error(`Failed to update a task for user "${user.username}"`, error.stack);
    //         throw new InternalServerErrorException();
    //     }
    // }
}
