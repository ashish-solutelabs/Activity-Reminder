import { forwardRef, Inject, Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from 'src/tasks/task.entity';
import { TaskRepository } from 'src/tasks/task.repository';
import { TasksService } from 'src/tasks/tasks.service';
import { Repository } from 'typeorm';
import { CreateCronDto } from './dto/create-cron.dto';
import { UpdateCronDto } from './dto/update-cron.dto';
import { Cronscheduler } from './entities/cron.entity';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class CronService {

  constructor(@InjectRepository(Cronscheduler) private cronRepository: Repository<Cronscheduler>,
             @Inject(forwardRef(() => TasksService)) private taskService: TasksService,

  ){} 

   @Cron(CronExpression.EVERY_30_SECONDS,{
        name: 'notifications',
        timeZone: 'Asia/Kolkata'
    })
    async handleCron() {
        const taskList = await this.cronRepository.find({status:TaskStatus.OPEN})
        if (taskList) {
            const now  = new Date()
            console.log(now)
            console.log(now.toLocaleDateString())
            for(let taskdata of taskList){
                let remindTime = new Date(taskdata.remindAt)


                if((now.toLocaleDateString()===remindTime.toLocaleDateString()) && (now.getHours()===remindTime.getHours())&&(remindTime.getMinutes()===now.getMinutes()))
                {
                    // console.log(now.toDateString(),remindTime.toDateString())
                    // console.log(now.getHours(),remindTime.getHours())

                    const accountSid = 'AC0028c56f3e02c49da627e11420474a3f'; 
                    const authToken = 'bb11c5bc785798d73656ac2222b5aef5'; 
                    const client = require('twilio')(accountSid, authToken); 
    
                    const status = await client.messages.create({ 
                            body: taskdata.reminderMassage, 
                            from: 'whatsapp:+14155238886',       
                            to: `whatsapp:${taskdata.phoneNumber}` 
                        }) 
                        .then((message: { sid: any; }) =>console.log(message.sid)) 
                        .done();

                    taskdata.status = TaskStatus.DONE
                    try {
                        await this.updateTaskStatus(taskdata);
                    } catch (error) {
                            throw new InternalServerErrorException();
                    }
                }
            }
        }
    }


  async updateTaskStatus(taskdata){

    const deleteCron = await this.cronRepository.remove(taskdata)
    
    if(!deleteCron){
      throw new NotAcceptableException("doesn't update cron task in server");
    }

    // const taskinfo = await this.taskService.updateCronStatus(task)
    // console.log("taskinfo:",taskinfo)
    // taskinfo.status = TaskStatus.DONE
    // await this.taskRepository.save(taskinfo)
    return
  } 


  async create(createCronDto) {
      const cronjob = await this.cronRepository.save(createCronDto)
      if(!cronjob){
        throw new NotAcceptableException("doesn't create cron task in server");
      }
      return cronjob
  }

  async findAll() {
    const tasklist =  await this.cronRepository.find()
    return tasklist;
  }

  async update(id: number, updateCronDto) {
    const taskdata = await this.cronRepository.findOne({ where: { task: id } })

    const crontask = {
      reminderMassage:`title:${updateCronDto.title}\ndesc:${updateCronDto.description}`,
      phoneNumber:taskdata.phoneNumber,
      email:taskdata.email,
      status:updateCronDto.status,
      remindAt:updateCronDto.remindAt,
    }
    Object.assign(taskdata,crontask)

    const taskinfo = await this.cronRepository.save(taskdata)

    if(!taskinfo){
      throw new NotAcceptableException("doesn't update cron task in server");
    }
    return taskinfo
  }

  async remove(id: number) {

    const taskdata = await this.cronRepository.findOne({ where: { task: id } });
    const taskinfo = await this.cronRepository.remove(taskdata)
    
    if(!taskinfo){
      throw new NotAcceptableException("doesn't update cron task in server");
    }
    return taskinfo
  }
}
