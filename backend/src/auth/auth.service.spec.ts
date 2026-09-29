import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { MailService } from '../mail/mail.service.js';
import { RedisService } from '../redis/redis.service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { UserApprovalStatus } from '../users/enums/approval-status.enum.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { RefreshTokenEntity } from './entities/refresh-token.entity.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: UserEntity = {
    id: 10,
    fullName: 'Juan Perez',
    email: 'juan@test.com',
    password: '$2b$10$hashedpasswordstringvalue',
    isActive: true,
    isEmailVerified: true,
    approvalStatus: UserApprovalStatus.APPROVED,
    roles: [],
  } as UserEntity;

  const mockUsersService = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 10, ...dto })),
    update: vi.fn().mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
  };

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mock_token_jwt'),
    verify: vi.fn().mockReturnValue({ sub: 10, email: 'juan@test.com' }),
  };

  const mockRefreshTokenRepository = {
    create: vi.fn().mockImplementation((dto) => ({ ...dto })),
    save: vi.fn().mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
    findOne: vi.fn(),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockRedisService = {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
  };

  const mockAuditLogsService = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockMailService = {
    sendRegistrationPending: vi.fn().mockResolvedValue(true),
    sendEmailVerification: vi.fn().mockResolvedValue(true),
    sendPasswordReset: vi.fn().mockResolvedValue(true),
    sendPasswordResetSuccess: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUsersService.findByEmail.mockReset();
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockRedisService.get.mockReset();
    mockRedisService.get.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('verifyEmail', () => {
    it('debe verificar el email correctamente y activar al usuario', async () => {
      mockRedisService.get.mockImplementation(async (key: string) => {
        if (key.startsWith('user:email_verification:')) return 'valid_token_123';
        return null;
      });
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
        isActive: false,
      });

      const result = await service.verifyEmail('juan@test.com', 'valid_token_123');

      expect(mockUsersService.update).toHaveBeenCalledWith(10, {
        isEmailVerified: true,
        isActive: true,
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'user:email_verification:juan@test.com',
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMAIL_VERIFIED',
          module: 'AUTH',
        }),
      );
      expect(result.message).toContain('verificado exitosamente');
    });

    it('debe lanzar UnauthorizedException si el token es invalido o expiro', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(
        service.verifyEmail('juan@test.com', 'token_invalido'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('debe generar token de recuperacion y enviar correo si el usuario existe y no tiene token activo', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.forgotPassword('juan@test.com');

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'user:password_reset:juan@test.com',
        expect.any(String),
        3600,
      );
      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith(
        'juan@test.com',
        'Juan Perez',
        expect.any(String),
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_REQUESTED',
          module: 'AUTH',
        }),
      );
      expect(result.message).toContain('instrucciones');
    });

    it('debe lanzar NotFoundException si el correo no está registrado', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('noexiste@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar UnauthorizedException si la cuenta está inactiva', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.forgotPassword('juan@test.com')).rejects.toThrow(
        'desactivada',
      );
    });

    it('debe lanzar UnauthorizedException si la cuenta está pendiente de aprobación', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        approvalStatus: 'PENDING',
      });

      await expect(service.forgotPassword('juan@test.com')).rejects.toThrow(
        'pendiente de aprobación',
      );
    });

    it('debe lanzar UnauthorizedException si la cuenta ha sido rechazada', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        approvalStatus: 'REJECTED',
      });

      await expect(service.forgotPassword('juan@test.com')).rejects.toThrow(
        'rechazada',
      );
    });

    it('debe lanzar BadRequestException si ya existe un token de restablecimiento activo', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockRedisService.get.mockResolvedValue('active_token_123');

      await expect(
        service.forgotPassword('juan@test.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('debe restablecer la contrasena, activar usuario y enviar correo de confirmacion si el token es valido', async () => {
      mockRedisService.get.mockImplementation(async (key: string) => {
        if (key.startsWith('user:password_reset_token:')) return 'juan@test.com';
        if (key.startsWith('user:password_reset:')) return 'reset_token_123';
        return null;
      });
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.resetPassword({
        email: 'juan@test.com',
        token: 'reset_token_123',
        newPassword: 'newpassword123',
      });

      expect(mockUsersService.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          password: expect.any(String),
          isEmailVerified: true,
          isActive: true,
        }),
      );
      expect(mockMailService.sendPasswordResetSuccess).toHaveBeenCalledWith(
        'juan@test.com',
        'Juan Perez',
      );
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 10, isRevoked: false },
        { isRevoked: true },
      );
      expect(result.message).toContain('Contrasena restablecida exitosamente');
    });

    it('debe lanzar UnauthorizedException si el token de restablecimiento es invalido', async () => {
      mockRedisService.get.mockResolvedValue('otro_token');

      await expect(
        service.resetPassword({
          email: 'juan@test.com',
          token: 'token_malo',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('debe retornar el usuario si la contraseña es valida y el email esta verificado', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      const userWithHash = {
        ...mockUser,
        password: hashed,
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'APPROVED',
      };
      mockUsersService.findByEmail.mockResolvedValue(userWithHash);

      const result = await service.validateUser('juan@test.com', 'secret123');
      expect(result).toBeDefined();
      expect(result?.id).toBe(10);
    });

    it('debe lanzar UnauthorizedException si el usuario no tiene email verificado', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      const unverifiedUser = {
        ...mockUser,
        password: hashed,
        isEmailVerified: false,
        isActive: true,
        approvalStatus: 'APPROVED',
      };
      mockUsersService.findByEmail.mockResolvedValue(unverifiedUser);

      await expect(
        service.validateUser('juan@test.com', 'secret123'),
      ).rejects.toThrow('Debes verificar tu correo electrónico');
    });
  });

  describe('refreshTokens', () => {
    it('debe realizar la rotacion de refresh token', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 1,
        userId: 10,
        token: 'refresh_token_actual',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.refreshTokens('refresh_token_actual');

      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isRevoked: true,
        }),
      );
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('debe revocar los refresh tokens del usuario y registrar audit log', async () => {
      const result = await service.logout(10);

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 10, isRevoked: false },
        { isRevoked: true },
      );
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          module: 'AUTH',
        }),
      );
      expect(result.message).toContain('cerrada exitosamente');
    });
  });
});
