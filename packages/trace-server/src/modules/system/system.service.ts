import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建用户
  async create(createUserDto: CreateUserDto) {
    const { username, password, name, phone, status, roleId } = createUserDto;

    // 检查用户名是否已存在（只查未删除的）
    const exist = await this.prisma.user.findFirst({
      where: { username, status: 1 },
    });
    if (exist) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
        name: name || null,
        phone: phone || null,
        status: status ?? 1,
        roleId: BigInt(roleId),
      },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        status: true,
        roleId: true,
        createTime: true,
        updateTime: true,
      },
    });

    return { id: Number(user.id) };
  }

  // 获取用户列表（分页）
  async findAll(query: QueryUsersDto) {
    const { pageNum = 1, pageSize = 10, status, keyword } = query;

    const where: any = { status: 1 };

    if (status !== undefined) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [{ username: { contains: keyword } }, { name: { contains: keyword } }];
    }

    const total = await this.prisma.user.count({ where });

    const list = await this.prisma.user.findMany({
      where,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      orderBy: { createTime: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        status: true,
        roleId: true,
        createTime: true,
        updateTime: true,
        role: {
          select: {
            id: true,
            roleName: true,
          },
        },
      },
    });

    return {
      list: list.map((u) => ({
        ...u,
        id: Number(u.id),
        roleId: Number(u.roleId),
        role: u.role ? { id: Number(u.role.id), roleName: u.role.roleName } : null,
      })),
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 更新用户
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: BigInt(id), status: 1 },
    });
    if (!user) {
      throw new NotFoundException('用户不存在或已删除');
    }

    const data: any = {};
    if (updateUserDto.name !== undefined) data.name = updateUserDto.name;
    if (updateUserDto.phone !== undefined) data.phone = updateUserDto.phone;
    if (updateUserDto.status !== undefined) data.status = updateUserDto.status;
    if (updateUserDto.roleId !== undefined) data.roleId = BigInt(updateUserDto.roleId);

    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data,
    });

    return { message: '更新成功' };
  }

  // 删除用户（软删除）
  async remove(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: BigInt(id), status: 1 },
    });
    if (!user) {
      throw new NotFoundException('用户不存在或已删除');
    }

    await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: { status: 0 },
    });

    return { message: '删除成功' };
  }

  // 获取角色列表
  async findRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        roleName: true,
        permissions: true,
        description: true,
      },
    });

    return roles.map((r) => ({
      id: Number(r.id),
      roleName: r.roleName,
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      description: r.description,
    }));
  }
}
