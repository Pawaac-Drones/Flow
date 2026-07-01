import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('whatsapp_users')
export class WhatsappUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'verification_code',
  })
  verificationCode: string | null;

  @Column({ type: 'boolean', default: false, name: 'daily_digest_enabled' })
  dailyDigestEnabled: boolean;

  @Column({ type: 'time', default: '09:00:00', name: 'daily_digest_time' })
  dailyDigestTime: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.whatsappAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
