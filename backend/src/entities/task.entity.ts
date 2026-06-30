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
import { Project } from './project.entity';
import { Epic } from './epic.entity';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { ActivityLog } from './activity-log.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', nullable: true, name: 'epic_id' })
  epicId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_task_id' })
  parentTaskId: string | null;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'task_key' })
  taskKey: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'backlog' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: string;

  @Column({ type: 'uuid', nullable: true, name: 'assignee_id' })
  assigneeId: string | null;

  @Column({ type: 'uuid', name: 'reporter_id' })
  reporterId: string;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: Date | null;

  @Column({ type: 'text', array: true, default: '{}' })
  labels: string[];

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Epic, (epic) => epic.tasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'epic_id' })
  epic: Epic | null;

  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask: Task | null;

  @OneToMany(() => Task, (task) => task.parentTask)
  subtasks: Task[];

  @ManyToOne(() => User, (user) => user.assignedTasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @ManyToOne(() => User, (user) => user.reportedTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => ActivityLog, (log) => log.task)
  activityLogs: ActivityLog[];
}
