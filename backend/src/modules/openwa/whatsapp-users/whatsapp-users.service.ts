import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { WhatsappUser } from '../../../entities/whatsapp-user.entity';

/**
 * Normalize a phone number to digits-only form.
 * Strips a leading "+", spaces, dashes and parentheses so that the value
 * matches the format extracted from incoming WhatsApp ids
 * (e.g. "919876543210@c.us" -> "919876543210").
 */
export function normalizePhoneNumber(input: string): string {
  return (input || '').replace(/[^0-9]/g, '');
}

@Injectable()
export class WhatsappUsersService {
  private readonly logger = new Logger(WhatsappUsersService.name);

  constructor(
    @InjectRepository(WhatsappUser)
    private readonly whatsappUserRepository: Repository<WhatsappUser>,
  ) {}

  private generateVerificationCode(): string {
    // 6-digit numeric code, zero-padded
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  /**
   * Link a WhatsApp number to the given user. The number starts unverified
   * and is assigned a verification code that the user must send to the bot.
   */
  async linkNumber(
    userId: string,
    rawPhoneNumber: string,
  ): Promise<WhatsappUser> {
    const phoneNumber = normalizePhoneNumber(rawPhoneNumber);

    if (phoneNumber.length < 8) {
      throw new ConflictException('Invalid phone number');
    }

    const existing = await this.whatsappUserRepository.findOne({
      where: { phoneNumber },
    });

    if (existing) {
      if (existing.userId === userId) {
        // Re-linking own number: regenerate a verification code if still unverified
        if (!existing.isVerified) {
          existing.verificationCode = this.generateVerificationCode();
          return this.whatsappUserRepository.save(existing);
        }
        throw new ConflictException(
          'This number is already linked and verified to your account.',
        );
      }
      throw new ConflictException(
        'This phone number is already linked to another account.',
      );
    }

    const whatsappUser = this.whatsappUserRepository.create({
      userId,
      phoneNumber,
      isVerified: false,
      verificationCode: this.generateVerificationCode(),
    });

    const saved = await this.whatsappUserRepository.save(whatsappUser);
    this.logger.log(
      `Linked WhatsApp number ${phoneNumber} to user ${userId} (pending verification)`,
    );
    return saved;
  }

  async findForUser(userId: string): Promise<WhatsappUser[]> {
    return this.whatsappUserRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async unlink(userId: string, id: string): Promise<{ message: string }> {
    const whatsappUser = await this.whatsappUserRepository.findOne({
      where: { id, userId },
    });

    if (!whatsappUser) {
      throw new NotFoundException('Linked WhatsApp number not found');
    }

    await this.whatsappUserRepository.remove(whatsappUser);
    this.logger.log(
      `Unlinked WhatsApp number ${whatsappUser.phoneNumber} from user ${userId}`,
    );
    return { message: 'WhatsApp number unlinked successfully' };
  }
}
