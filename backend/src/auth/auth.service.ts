import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { MailService } from '../mail/mail.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  UserApprovalStatus,
} from '../users/enums/approval-status.enum.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { RefreshTokenEntity } from './entities/refresh-token.entity.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
    private readonly mailService: MailService,
  ) {}

  async verifyEmail(email: string, token: string) {
    const storedToken = await this.redisService.get<string>(
      `user:email_verification:${email}`,
    );

    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedException(
        'Token de verificacion invalido o expirado',
      );
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const pendingPassword = await this.redisService.get<string>(
      `user:pending_password_link:${email}`,
    );

    const updatePayload: Partial<UserEntity> = {
      isEmailVerified: true,
      isActive: true,
    };

    if (pendingPassword) {
      updatePayload.password = pendingPassword;
      await this.redisService.del(`user:pending_password_link:${email}`);
    }

    await this.usersService.update(user.id, updatePayload);
    await this.redisService.del(`user:email_verification:${email}`);

    this.mailService
      .sendWelcomeEmail(user.email, user.fullName)
      .catch((err) =>
        this.logger.error(
          `Error enviando correo de bienvenida a ${user.email}: ${err.message}`,
        ),
      );

    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      action: pendingPassword
        ? 'ACCOUNT_LINKED_PASSWORD_ADDED'
        : 'EMAIL_VERIFIED',
      module: 'AUTH',
    });

    return {
      message: 'Correo electrónico verificado exitosamente. Ahora puedes iniciar sesión.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(
        'El correo electrónico no se encuentra registrado en el sistema.',
      );
    }

    if (user.approvalStatus === UserApprovalStatus.PENDING) {
      throw new UnauthorizedException(
        'Tu solicitud de registro está pendiente de aprobación por un Administrador.',
      );
    }

    if (user.approvalStatus === UserApprovalStatus.REJECTED) {
      throw new UnauthorizedException(
        'Tu solicitud de registro ha sido rechazada por el Administrador.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Tu cuenta se encuentra desactivada. Por favor contacta al Administrador.',
      );
    }

    const existingToken = await this.redisService.get<string>(
      `user:password_reset:${email}`,
    );

    if (existingToken) {
      throw new BadRequestException(
        'Ya se ha enviado un correo de recuperacion activo a esta direccion. Por favor revisa tu bandeja de entrada o intenta de nuevo mas tarde.',
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      `user:password_reset:${email}`,
      resetToken,
      3600,
    );
    await this.redisService.set(
      `user:password_reset_token:${resetToken}`,
      email,
      3600,
    );

    // Send password reset email asynchronously
    this.mailService
      .sendPasswordReset(user.email, user.fullName, resetToken)
      .catch((err) =>
        this.logger.error(
          `Error enviando correo de restablecimiento a ${user.email}: ${err.message}`,
        ),
      );

    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      module: 'AUTH',
    });

    return {
      message:
        'Si el correo electronico se encuentra registrado, recibira las instrucciones para restablecer su contrasena.',
      resetToken,
    };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const storedToken = await this.redisService.get<string>(
      `user:password_reset:${resetDto.email}`,
    );
    const boundEmail = await this.redisService.get<string>(
      `user:password_reset_token:${resetDto.token}`,
    );

    if (
      !storedToken ||
      storedToken !== resetDto.token ||
      !boundEmail ||
      boundEmail.toLowerCase() !== resetDto.email.toLowerCase()
    ) {
      throw new UnauthorizedException(
        'Token de restablecimiento invalido, expirado o no corresponde al correo indicado',
      );
    }

    const user = await this.usersService.findByEmail(resetDto.email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const hashedPassword = await bcrypt.hash(resetDto.newPassword, 10);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      isEmailVerified: true,
      isActive: true,
      mustChangePassword: false,
    });

    await this.redisService.del(`user:password_reset:${resetDto.email}`);
    await this.redisService.del(`user:password_reset_token:${resetDto.token}`);

    await this.refreshTokenRepository.update(
      { userId: user.id, isRevoked: false },
      { isRevoked: true },
    );

    // Send password reset confirmation email asynchronously
    this.mailService
      .sendPasswordResetSuccess(user.email, user.fullName)
      .catch((err) =>
        this.logger.error(
          `Error enviando correo de confirmacion a ${user.email}: ${err.message}`,
        ),
      );

    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'AUTH',
    });

    return {
      message:
        'Contrasena restablecida exitosamente. Ahora puede iniciar sesion con su nueva contrasena.',
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.password) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      mustChangePassword: false,
    });

    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_CHANGED',
      module: 'AUTH',
    });

    return {
      message: 'Contraseña actualizada exitosamente.',
    };
  }

  async validateUser(email: string, pass: string): Promise<UserEntity | null> {
    const user = await this.usersService.findByEmail(email);

    if (user) {
      if (user.approvalStatus === UserApprovalStatus.PENDING) {
        throw new UnauthorizedException(
          'Tu solicitud de registro está pendiente de aprobación por un Administrador.',
        );
      }

      if (user.approvalStatus === UserApprovalStatus.REJECTED) {
        throw new UnauthorizedException(
          'Tu solicitud de registro ha sido rechazada por el Administrador.',
        );
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Tu cuenta se encuentra desactivada. Por favor contacta al Administrador.',
        );
      }

      if (!user.isEmailVerified) {
        throw new UnauthorizedException(
          'Debes verificar tu correo electrónico antes de iniciar sesión. Por favor revisa tu bandeja de entrada.',
        );
      }

      if (user.password) {
        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
          throw new UnauthorizedException(
            'Credenciales incorrectas. Por favor verifica tu correo y contraseña.',
          );
        }
        return user;
      }
    }

    return null;
  }

  async generateTokens(
    user: UserEntity,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        token: refreshTokenValue,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      }),
    );

    await this.redisService.set(
      `user:refresh_token:${user.id}:${refreshTokenValue}`,
      true,
      7 * 24 * 3600,
    );

    await this.auditLogsService.log({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      module: 'AUTH',
      ipAddress,
      userAgent,
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenValue,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async refreshTokens(
    refreshTokenStr: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const payload = this.jwtService.verify(refreshTokenStr);
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { token: refreshTokenStr, isRevoked: false },
      });

      if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
        throw new UnauthorizedException('Refresh Token no valido o revocado');
      }

      tokenRecord.isRevoked = true;
      await this.refreshTokenRepository.save(tokenRecord);
      await this.redisService.del(
        `user:refresh_token:${payload.sub}:${refreshTokenStr}`,
      );

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive || !user.isEmailVerified) {
        throw new UnauthorizedException('Usuario inactivo o no verificado');
      }

      return this.generateTokens(user, ipAddress, userAgent);
    } catch (err) {
      throw new UnauthorizedException('Refresh Token expirado o invalido');
    }
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
    await this.auditLogsService.log({
      userId,
      action: 'LOGOUT',
      module: 'AUTH',
    });
    return { message: 'Sesion cerrada exitosamente' };
  }
}
