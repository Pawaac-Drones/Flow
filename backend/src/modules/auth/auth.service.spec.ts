import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;

  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default token + config behaviour
    jwtService.sign.mockImplementation(
      (_payload: unknown, options?: unknown) =>
        options ? 'refresh-token' : 'access-token',
    );
    configService.get.mockReturnValue('some-secret');
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123',
      displayName: 'New User',
    };

    it('hashes the password and returns tokens + sanitized user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockImplementation((data: Partial<User>) => data);
      userRepository.save.mockImplementation(async (data: Partial<User>) => ({
        id: 'user-1',
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        ...data,
      }));

      const result = await service.register(registerDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          passwordHash: 'hashed-value',
          displayName: registerDto.displayName,
          role: 'member',
        }),
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(registerDto.email);
      // Sanitized user must not leak the password hash.
      expect(
        (result.user as Record<string, unknown>).passwordHash,
      ).toBeUndefined();
    });

    it('rejects a duplicate email', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'existing',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'user@example.com', password: 'Password123' };
    const activeUser = {
      id: 'user-1',
      email: loginDto.email,
      passwordHash: 'stored-hash',
      displayName: 'User',
      avatarUrl: null,
      role: 'member',
      isActive: true,
      createdAt: new Date(),
    };

    it('validates credentials and returns tokens on success', async () => {
      userRepository.findOne.mockResolvedValue({ ...activeUser });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        activeUser.passwordHash,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.user.id).toBe('user-1');
    });

    it('rejects when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the password is invalid', async () => {
      userRepository.findOne.mockResolvedValue({ ...activeUser });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the account is deactivated', async () => {
      userRepository.findOne.mockResolvedValue({
        ...activeUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
