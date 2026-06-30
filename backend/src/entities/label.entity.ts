import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7, default: '#6366f1' })
  color: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project, (project) => project.labels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
