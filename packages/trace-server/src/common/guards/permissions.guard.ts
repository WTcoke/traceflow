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

    const permissions: string[] = Array.isArray(role.permissions)
      ? (role.permissions as string[])
      : [];
    const hasPermission = requiredPermissions.every((perm) => permissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
