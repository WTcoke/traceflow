import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /login', () => {
    it('应返回登录成功数据', async () => {
      const loginDto: LoginDto = { username: 'admin', password: '123456' };
      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 7200,
        userInfo: { id: 1, username: 'admin', name: '管理员', roleId: 1 },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, '127.0.0.1', 'jest-test');

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, '127.0.0.1', 'jest-test');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('POST /refresh', () => {
    it('应从 Authorization 头提取 refreshToken 并刷新', async () => {
      const expectedResult = {
        accessToken: 'new-access-token',
        expiresIn: 7200,
      };

      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(
        'Bearer valid-refresh-token',
        '127.0.0.1',
        'jest-test',
      );

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'valid-refresh-token',
        '127.0.0.1',
        'jest-test',
      );
      expect(result).toEqual(expectedResult);
    });

    it('Authorization 头为空时应传递空字符串', async () => {
      mockAuthService.refresh.mockResolvedValue({ accessToken: 'token', expiresIn: 7200 });

      await controller.refresh(undefined as any, '127.0.0.1', 'jest-test');

      expect(mockAuthService.refresh).toHaveBeenCalledWith('', '127.0.0.1', 'jest-test');
    });
  });

  describe('POST /logout', () => {
    it('应从 Authorization 头提取 token 并登出', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });

      const result = await controller.logout('Bearer token-to-revoke');

      expect(mockAuthService.logout).toHaveBeenCalledWith('token-to-revoke');
      expect(result).toEqual({ success: true });
    });
  });
});
