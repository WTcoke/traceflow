import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('system')
@UsePipes(ValidationPipe)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // 4.2.1 获取用户列表（分页）
  @Get('users')
  @Permissions('user:read')
  findAll(@Query() query: QueryUsersDto) {
    return this.systemService.findAll(query);
  }

  // 4.2.2 创建用户
  @Post('user')
  @Permissions('user:create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.systemService.create(createUserDto);
  }

  // 4.2.3 更新用户信息
  @Put('user/:id')
  @Permissions('user:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.systemService.update(id, updateUserDto);
  }

  // 4.2.4 删除用户（软删除）
  @Delete('user/:id')
  @Permissions('user:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.systemService.remove(id);
  }

  // 4.2.5 获取角色列表
  @Get('roles')
  @Permissions('role:read')
  findRoles() {
    return this.systemService.findRoles();
  }
}
