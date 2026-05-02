import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const map: Record<string, any> = {
        JWT_SECRET: 'test-secret',
        JWT_ACCESS_EXPIRES_IN: 7200,
        JWT_REFRESH_EXPIRES_IN_DAYS: 7,
      };
      return map[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = { username: 'admin', password: '123456' };

    it('登录成功应返回 token 和用户信息', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const user = {
        id: BigInt(1),
        username: 'admin',
        passwordHash: hashedPassword,
        name: '管理员',
        status: 1,
        roleId: BigInt(1),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: BigInt(1) });

      const result = await service.login(loginDto, '127.0.0.1', 'jest-test');

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(7200);
      expect(result.userInfo).toEqual({
        id: 1,
        username: 'admin',
        name: '管理员',
        roleId: 1,
      });
    });

    it('用户名不存在应抛出 UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('用户名或密码错误');
    });

    it('密码错误应抛出 UnauthorizedException', async () => {
      const hashedPassword = await bcrypt.hash('wrong-password', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        passwordHash: hashedPassword,
        status: 1,
        roleId: BigInt(1),
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('账号已禁用应抛出 ForbiddenException', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        passwordHash: hashedPassword,
        name: '管理员',
        status: 0,
        roleId: BigInt(1),
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      await expect(service.login(loginDto)).rejects.toThrow('账号已被禁用');
    });
  });

  describe('refresh', () => {
    it('刷新成功应返回新的 accessToken', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: BigInt(1),
        userId: BigInt(1),
        tokenHash: expect.any(String),
        revoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        status: 1,
        roleId: BigInt(1),
      });

      mockPrisma.refreshToken.update.mockResolvedValue({});

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.expiresIn).toBe(7200);
      expect((result as any).refreshToken).toBeUndefined();
    });

    it('空的 refreshToken 应抛出 UnauthorizedException', async () => {
      await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh('')).rejects.toThrow('refreshToken 不能为空');
    });

    it('无效的 refreshToken 应抛出 UnauthorizedException', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh('invalid-token')).rejects.toThrow('刷新令牌无效或已过期');
    });

    it('账号已禁用时应抛出 ForbiddenException', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: BigInt(1),
        userId: BigInt(1),
        tokenHash: 'hash',
        revoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: BigInt(1),
        username: 'admin',
        status: 0,
        roleId: BigInt(1),
      });

      await expect(service.refresh('valid-token')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('应使 refreshToken 失效', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: BigInt(1),
        tokenHash: 'hash',
        revoked: false,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});

      const result = await service.logout('some-token');
      expect(result.success).toBe(true);
    });

    it('token 不存在也应返回成功', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      const result = await service.logout('non-existent-token');
      expect(result.success).toBe(true);
    });
  });
});
