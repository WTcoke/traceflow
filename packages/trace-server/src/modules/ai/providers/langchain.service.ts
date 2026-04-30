import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  AiQueryRequest,
  AiQueryResponse,
  AiAnalyzeRequest,
  AiAnalysisResult,
  AiAnalysisType,
} from '../interfaces/ai.interfaces';

@Injectable()
export class LangChainService {
  private readonly logger = new Logger(LangChainService.name);
  private llm: ChatOpenAI;
  private readonly modelName: string;
  private readonly temperature = 0;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.modelName = this.configService.get('AI_MODEL_NAME', 'qwen-turbo');

    this.llm = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
      apiKey: this.configService.get('DASHSCOPE_API_KEY'),
      configuration: {
        baseURL: this.configService.get(
          'DASHSCOPE_BASE_URL',
          'https://dashscope.aliyuncs.com/compatible-mode/v1',
        ),
      },
      cache: true,
    });
  }

  async queryWithSql(request: AiQueryRequest): Promise<AiQueryResponse> {
    const sqlTemplate = `你是一个埋点数据分析助手。根据用户的自然语言问题，生成对应的 SQL 查询语句。

数据库表结构：
- buried_point_data: 埋点数据表
  - id: BIGINT
  - msg_id: VARCHAR(64)
  - project_id: BIGINT (项目ID)
  - device_id: VARCHAR(128) (设备ID)
  - user_id: VARCHAR(64) (用户ID)
  - event_time: BIGINT (事件时间，毫秒时间戳)
  - event_type: ENUM('behavior', 'performance', 'error') (事件类型)
  - platform: VARCHAR(20) (平台)
  - data: JSON (业务数据)

用户问题：{question}

请生成对应的 SQL 查询语句，只返回 SQL 语句，不要包含其他内容。`;

    const prompt = await PromptTemplate.fromTemplate(sqlTemplate);
    const chain = prompt.pipe(this.llm);

    const result = await chain.invoke({ question: request.question });
    const sql = (result.content as string).trim();

    try {
      const queryResult = await this.executeSqlSafely(sql, request.projectId);

      const explanationPrompt = `基于以下 SQL 查询结果，用自然语言解释给用户。

SQL: {sql}
结果: {result}
问题: {question}

请给出简洁明了的解释。`;

      const expPrompt = await PromptTemplate.fromTemplate(explanationPrompt);
      const expChain = expPrompt.pipe(this.llm);
      const explanationResult = await expChain.invoke({
        sql,
        result: JSON.stringify(queryResult),
        question: request.question,
      });

      return {
        sql,
        result: queryResult,
        explanation: explanationResult.content as string,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`SQL execution failed: ${err.message}`);

      return {
        sql,
        result: [],
        explanation: `生成的 SQL 可能存在问题，请检查：${err.message}`,
      };
    }
  }

  private async executeSqlSafely(
    sql: string,
    projectId: bigint,
  ): Promise<Array<Record<string, any>>> {
    const normalizedSql = sql.toLowerCase();

    if (!normalizedSql.includes('project_id')) {
      throw new Error('SQL 必须包含 project_id 条件');
    }

    if (
      normalizedSql.includes('drop') ||
      normalizedSql.includes('delete') ||
      normalizedSql.includes('update') ||
      normalizedSql.includes('insert') ||
      normalizedSql.includes('truncate') ||
      normalizedSql.includes('alter')
    ) {
      throw new Error('只允许 SELECT 查询');
    }

    const limitedSql = sql.includes('LIMIT') ? sql : `${sql} LIMIT 100`;

    try {
      const results = await this.prismaService.$queryRawUnsafe(limitedSql);
      return results as Array<Record<string, any>>;
    } catch (error) {
      const err = error as Error;
      throw new Error(`查询执行失败：${err.message}`);
    }
  }

  async query(request: AiQueryRequest): Promise<AiQueryResponse> {
    return this.queryWithSql(request);
  }

  async analyze(request: AiAnalyzeRequest): Promise<AiAnalysisResult> {
    const template = this.getAnalysisTemplate(request.analysisType);

    const prompt = await PromptTemplate.fromTemplate(template);

    const chain = prompt.pipe(this.llm);

    const result = await chain.invoke({
      projectId: request.projectId.toString(),
      analysisType: request.analysisType,
      startTime: request.data?.startTime?.toString() || '',
      endTime: request.data?.endTime?.toString() || '',
    });

    const content = result.content as string;
    try {
      const parsedResult = JSON.parse(content);
      return {
        projectId: request.projectId,
        analysisType: request.analysisType,
        analysisData: parsedResult,
      };
    } catch {
      return {
        projectId: request.projectId,
        analysisType: request.analysisType,
        analysisData: { raw: content },
      };
    }
  }

  private getAnalysisTemplate(analysisType: string): string {
    const templates: Record<string, string> = {
      statistics: `分析以下埋点统计数据，给出关键洞察：

项目ID：{projectId}
分析类型：{analysisType}
时间范围：{startTime} - {endTime}

请返回JSON格式的分析结果：
{
  "summary": "总体概述",
  "keyFindings": ["发现1", "发现2"],
  "trends": ["趋势1", "趋势2"],
  "recommendations": ["建议1", "建议2"]
}`,

      error_analysis: `分析以下错误日志，识别问题模式：

项目ID：{projectId}
分析类型：{analysisType}
时间范围：{startTime} - {endTime}

请返回JSON格式的分析结果：
{
  "errorCount": 数量,
  "errorTypes": ["类型1", "类型2"],
  "topErrors": [{"error": "错误描述", "count": 次数}],
  "rootCauses": ["原因1", "原因2"],
  "suggestions": ["建议1", "建议2"]
}`,

      performance_analysis: `分析以下性能数据，识别优化点：

项目ID：{projectId}
分析类型：{analysisType}
时间范围：{startTime} - {endTime}

请返回JSON格式的分析结果：
{
  "avgLoadTime": 平均加载时间,
  "slowPages": ["慢页面1", "慢页面2"],
  "performanceScores": {"score": 分数, "metrics": {}},
  "optimizationTips": ["优化建议1", "优化建议2"]
}`,

      behavior_analysis: `分析以下用户行为数据，发现用户模式：

项目ID：{projectId}
分析类型：{analysisType}
时间范围：{startTime} - {endTime}

请返回JSON格式的分析结果：
{
  "userCount": 用户数,
  "sessionCount": 会话数,
  "topPages": ["页面1", "页面2"],
  "userPatterns": ["模式1", "模式2"],
  "insights": ["洞察1", "洞察2"]
}`,

      anomaly_detection: `检测埋点数据中的异常：

项目ID：{projectId}
分析类型：{analysisType}
时间范围：{startTime} - {endTime}

请返回JSON格式的分析结果：
{
  "anomalies": [{"time": 时间戳, "type": "异常类型", "score": 置信度, "description": "描述"}],
  "summary": "异常摘要",
  "recommendations": ["处理建议1", "处理建议2"]
}`,
    };

    return templates[analysisType] || templates.statistics;
  }
}
