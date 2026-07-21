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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('项目管理')
@ApiBearerAuth()
@Controller('project')
@UsePipes(ValidationPipe)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // 4.3.1 获取项目列表
  @Get('list')
  @ApiOperation({ summary: '获取项目列表', description: '支持分页和关键字搜索' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @Permissions('project:read')
  findAll(@Query() query: QueryProjectDto) {
    return this.projectService.findAll(query);
  }

  // 4.3.2 创建项目
  @Post()
  @ApiOperation({ summary: '创建项目', description: '创建新项目，自动生成 appId 和 projectKey' })
  @ApiResponse({ status: 200, description: '创建成功' })
  @ApiResponse({ status: 409, description: '项目名称已存在' })
  @Permissions('project:create')
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    const creatorId = req.user?.id ? Number(req.user.id) : 0;
    return this.projectService.create(createProjectDto, creatorId);
  }

  // 4.3.3 获取项目详情
  @Get(':id')
  @ApiOperation({ summary: '获取项目详情', description: '根据ID获取项目详情（不返回projectKey）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '项目不存在或已删除' })
  @Permissions('project:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.findOne(id);
  }

  // 4.3.4 更新项目配置
  @Put(':id')
  @ApiOperation({ summary: '更新项目配置', description: '更新项目信息、配置或状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '项目不存在或已删除' })
  @Permissions('project:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  // 4.3.5 删除项目（软删除）
  @Delete(':id')
  @ApiOperation({ summary: '删除项目', description: '软删除项目，关联数据保留' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '项目不存在或已删除' })
  @Permissions('project:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.remove(id);
  }
}
