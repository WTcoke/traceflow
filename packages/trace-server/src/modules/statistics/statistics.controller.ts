import { Controller, Get, Query, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('api/v1/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * 统计概览（PV/UV/错误数）
   * @param authorization 授权令牌
   * @param projectId 项目ID
   * @param startTime 开始时间戳（毫秒）
   * @param endTime 结束时间戳（毫秒）
   * @param granularity 时间粒度（hour/day，默认 hour）
   * @returns 统计概览数据
   */
  @Get('overview')
  async getOverview(
    @Headers('Authorization') authorization: string,
    @Query('projectId') projectId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('granularity') granularity: string = 'hour',
  ) {
    // 参数校验
    if (!projectId || !startTime || !endTime) {
      throw new HttpException('参数校验失败', HttpStatus.BAD_REQUEST);
    }

    const start = BigInt(startTime);
    const end = BigInt(endTime);
    const result = await this.statisticsService.getOverview(projectId, start, end, granularity);

    return {
      code: 200,
      message: '请求成功',
      data: result,
      requestId: this.generateRequestId(),
    };
  }

  /**
   * 生成唯一请求ID
   */
  private generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
