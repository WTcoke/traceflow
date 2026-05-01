import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录', description: '管理员/用户登录，返回 JWT Token' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 400, description: '用户名或密码错误 / 账号已被禁用' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 Token', description: '使用 refreshToken 换取新的 accessToken' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '刷新令牌无效或已过期' })
  async refresh(
    @Headers('authorization') authorization: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const refreshToken = this.extractBearerToken(authorization);
    return this.authService.refresh(refreshToken, ip, userAgent);
  }

  @Post('logout')
  @ApiOperation({ summary: '用户登出', description: '使当前 refreshToken 失效' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(@Headers('authorization') authorization: string) {
    const refreshToken = this.extractBearerToken(authorization);
    return this.authService.logout(refreshToken);
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization) {
      return '';
    }
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' && token ? token : '';
  }
}
