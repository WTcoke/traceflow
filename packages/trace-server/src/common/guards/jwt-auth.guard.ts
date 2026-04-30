import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('令牌格式无效');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET', 'traceflow-secret');
      const decoded = jwt.verify(token, secret) as any;
      request.user = {
        id: decoded.sub || decoded.id,
        username: decoded.username,
        roleId: decoded.roleId,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('令牌已过期或无效');
    }
  }
}
