import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { StatisticsOverviewQueryDto } from './dto/statistics-overview-query.dto';
import { StatisticsOverviewResponseDto } from './dto/statistics-overview-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: '统计概览（PV/UV/错误数）',
    description: '获取指定项目在时间范围内的PV、UV、错误数量及性能指标',
  })
  @Permissions('statistics:read')
  async getOverview(
    @Query() query: StatisticsOverviewQueryDto,
  ): Promise<StatisticsOverviewResponseDto> {
    return this.statisticsService.getOverview(query);
  }
}
