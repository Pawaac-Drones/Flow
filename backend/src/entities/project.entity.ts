import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProjectMember } from './project-member.entity';
import { Epic } from './epic.entity';
import { Task } from './task.entity';
import { StatusWorkflow } from './status-workflow.entity';
import { Label } from './label.entity';
import { ActivityLog } from './activity-log.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'int', default: 0, name: 'task_counter' })
  taskCounter: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => ProjectMember, (pm) => pm.project)
  members: ProjectMember[];

  @OneToMany(() => Epic, (epic) => epic.project)
  epics: Epic[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @OneToMany(() => StatusWorkflow, (sw) => sw.project)
  statusWorkflows: StatusWorkflow[];

  @OneToMany(() => Label, (label) => label.project)
  labels: Label[];

  @OneToMany(() => ActivityLog, (log) => log.project)
  activityLogs: ActivityLog[];
}
