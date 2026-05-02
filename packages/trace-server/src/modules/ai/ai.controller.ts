import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  AiQueryDto,
  AiAnalyzeDto,
  AiQueryResponseDto,
  AiAnalyzeResponseDto,
  AiResultResponseDto,
} from './dto/ai.dto';

@ApiTags('AI 智能分析')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  @ApiOperation({ summary: '自然语言查询埋点数据' })
  async query(@Body() dto: AiQueryDto): Promise<AiQueryResponseDto> {
    return this.aiService.query({
      projectId: dto.projectId,
      question: dto.question,
    });
  }

  @Post('analyze')
  @ApiOperation({ summary: '提交 AI 分析任务' })
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
  @ApiOperation({ summary: '查询 AI 分析结果' })
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
