import { Repository, EntityRepository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../auth/user.entity';
import { Logger, InternalServerErrorException, Inject, forwardRef, NotAcceptableException } from '@nestjs/common';
import { CronService } from 'src/cron/cron.service';

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

        const status = await task.save()

        if(!status){
            throw new NotAcceptableException("Data is not store in server");
        }
        
        delete status.user;
        return status;
    }

    async find(){
        const query = this.createQueryBuilder('task');
        query.andWhere('task.status = :status', { status:"OPEN" });
        const tasklist  = await query.getMany();
        return tasklist
    }
    // async findById(id:number){

    // }
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
