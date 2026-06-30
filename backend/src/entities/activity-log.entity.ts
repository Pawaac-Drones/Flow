import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', nullable: true, name: 'task_id' })
  taskId: string | null;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  field: string | null;

  @Column({ type: 'text', nullable: true, name: 'old_value' })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true, name: 'new_value' })
  newValue: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project, (project) => project.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Task, (task) => task.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task | null;

  @ManyToOne(() => User, (user) => user.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
