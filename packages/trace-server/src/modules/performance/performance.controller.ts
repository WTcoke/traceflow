import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { PerformanceMetricsQueryDto } from './dto/performance-metrics-query.dto';
import { PerformanceMetricsResponseDto } from './dto/performance-metrics-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('metrics')
  @ApiOperation({ summary: '性能指标查询', description: '查询项目中的性能指标数据' })
  @Permissions('performance:read')
  getMetrics(@Query() query: PerformanceMetricsQueryDto): PerformanceMetricsResponseDto {
    return this.performanceService.getMetrics(query);
  }
}
