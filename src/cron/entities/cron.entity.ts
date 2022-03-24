import { User } from "src/auth/user.entity";
import { Task } from "src/tasks/task.entity";
import { PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, Entity } from "typeorm";
import { TaskStatus } from "../task-status.enum";

@Entity('cronscheduler')
export class Cronscheduler {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reminderMassage: string;

    @Column()
    phoneNumber:string
    
    @Column()
    email:string
    
    @Column()
    status: TaskStatus;

    @Column()
    remindAt:string

    @OneToOne(() => Task)
    @JoinColumn()
    task: Task
}
