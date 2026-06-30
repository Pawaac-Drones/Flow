import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      displayName: registerDto.displayName,
      role: 'member',
    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    await this.updateRefreshTokenHash(savedUser.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.sanitizeUser(user),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshTokenHash: null });
    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.userRepository.update(userId, { refreshTokenHash: hash });
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
