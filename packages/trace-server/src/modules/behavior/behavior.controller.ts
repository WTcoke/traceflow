import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BehaviorService } from './behavior.service';
import { BehaviorPathsQueryDto } from './dto/behavior-paths-query.dto';
import { BehaviorPathsResponseDto } from './dto/behavior-paths-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('behavior')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('behavior')
export class BehaviorController {
  constructor(private readonly behaviorService: BehaviorService) {}

  @Get('paths')
  @ApiOperation({ summary: '用户行为路径查询', description: '查询用户在项目中的行为路径记录' })
  @Permissions('behavior:read')
  getPaths(@Query() query: BehaviorPathsQueryDto): BehaviorPathsResponseDto {
    return this.behaviorService.getPaths(query);
  }
}
