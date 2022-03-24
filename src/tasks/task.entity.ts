import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';
import { Cronscheduler } from 'src/cron/entities/cron.entity';

@Entity()
export class Task extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    status: TaskStatus;

    @Column()
    remindAt:string

    @ManyToOne(type => User, user => user.tasks, { eager: false })
    @JoinColumn()
    user: User;

    @Column()
    userId: number;
}
