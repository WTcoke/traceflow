import { Controller, Post, Get, Body, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  AiQueryDto,
  AiAnalyzeDto,
  AiQueryResponseDto,
  AiAnalyzeResponseDto,
  AiResultResponseDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('AI 智能分析')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  @ApiBearerAuth()
  @ApiOperation({ summary: '自然语言查询埋点数据' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ai.query')
  async query(@Body() dto: AiQueryDto): Promise<AiQueryResponseDto> {
    return this.aiService.query({
      projectId: dto.projectId,
      question: dto.question,
    });
  }

  @Post('analyze')
  @ApiOperation({ summary: '提交 AI 分析任务' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ai.analyze')
  async analyze(@Body() dto: AiAnalyzeDto): Promise<AiAnalyzeResponseDto> {
    return this.aiService.submitAnalysis({
      projectId: dto.projectId,
      analysisType: dto.analysisType,
      data: {
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      options: dto.options,
    });
  }

  @Get('results')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询 AI 分析结果' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ai.results')
  @ApiQuery({ name: 'projectId', description: '项目ID', required: true })
  @ApiQuery({ name: 'analysisType', description: '分析类型', required: false })
  @ApiQuery({ name: 'pageNum', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  async getResults(
    @Query('projectId') projectId: string,
    @Query('analysisType') analysisType?: string,
    @Query('pageNum') pageNum?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<AiResultResponseDto> {
    if (!projectId) {
      throw new BadRequestException('projectId 不能为空');
    }
    return this.aiService.getAnalysisResults({
      projectId: Number(projectId),
      analysisType,
      pageNum: pageNum ? parseInt(pageNum, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
  }
}
