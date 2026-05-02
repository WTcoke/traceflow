import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('无权访问');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: BigInt(user.roleId) },
    });

    if (!role) {
      throw new ForbiddenException('角色不存在');
    }

    // 获取用户权限数组（你的字段是 JSON → 直接就是数组）
    const userPermissions = Array.isArray(role.permissions) ? role.permissions : [];
    console.log('用户权限：', userPermissions);
    // ========================
    // ✅ 通配符核心逻辑：只要包含 *，直接拥有所有权限
    // ========================
    if (userPermissions.includes('*')) {
      return true;
    }

    // 普通角色：必须拥有所有要求的权限
    const hasAllPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
    console.log('权限：', requiredPermissions);

    if (!hasAllPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
