import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new ForbiddenException('账号已被禁用');
    }

    const accessToken = this.generateAccessToken(user.id, user.username, user.roleId);
    const refreshToken = await this.generateRefreshToken(user.id, ip, userAgent);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 7200),
      userInfo: {
        id: Number(user.id),
        username: user.username,
        name: user.name,
        roleId: Number(user.roleId),
      },
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto, ip?: string, userAgent?: string) {
    const tokenHash = this.hashToken(refreshTokenDto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user || user.status !== 1) {
      throw new ForbiddenException('账号已被禁用');
    }

    await this.revokeRefreshToken(storedToken.id);

    const accessToken = this.generateAccessToken(user.id, user.username, user.roleId);
    const newRefreshToken = await this.generateRefreshToken(user.id, ip, userAgent);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 7200),
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false },
    });

    if (storedToken) {
      await this.revokeRefreshToken(storedToken.id);
    }

    return { success: true };
  }

  private generateAccessToken(userId: bigint, username: string, roleId: bigint): string {
    const payload = {
      sub: Number(userId),
      username,
      roleId: Number(roleId),
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 7200),
    });
  }

  private async generateRefreshToken(
    userId: bigint,
    ip?: string,
    userAgent?: string,
  ): Promise<string> {
    const token = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresInDays = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_DAYS', 7);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });

    return token;
  }

  private async revokeRefreshToken(tokenId: bigint) {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
