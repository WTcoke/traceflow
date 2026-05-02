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
      cache: false,
    });
  }

  async queryWithSql(request: AiQueryRequest): Promise<AiQueryResponse> {
    const sqlTemplate = `你是一个埋点数据分析助手。根据用户的自然语言问题，生成对应的 SQL 查询语句。

【表1：buried_point_data】埋点数据明细表（大表，已按 event_time 分区）
该表 ONLY 包含以下字段，严禁使用其他字段：
  - id: BIGINT UNSIGNED
  - msg_id: VARCHAR(64)
  - project_id: BIGINT UNSIGNED (项目ID，【必须】作为查询条件)
  - device_id: VARCHAR(128) (设备ID)
  - user_id: VARCHAR(64) (用户ID)
  - event_time: BIGINT UNSIGNED (事件时间，毫秒时间戳)
  - event_type: ENUM('behavior', 'performance', 'error') (事件类型)
  - platform: VARCHAR(20) (平台，如 web/ios/android)
  - user_agent: TEXT
  - ip: VARCHAR(45)
  - os: VARCHAR(50)
  - browser: VARCHAR(50)
  - country: VARCHAR(50)
  - province: VARCHAR(50)
  - city: VARCHAR(50)
  - data: JSON (原始业务数据)
  - is_abnormal: TINYINT (是否异常)
  - v_error_type: VARCHAR(100) (错误类型，【仅】该表有此字段)
  - v_page_url: VARCHAR(500) (页面URL，【仅】该表有此字段)
  - create_time: DATETIME

【表2：statistics】聚合统计表（小表，查询性能高）
该表 ONLY 包含以下字段，严禁使用其他字段：
  - id: BIGINT UNSIGNED
  - project_id: BIGINT
  - event_type: ENUM('behavior', 'performance', 'error')
  - stat_time: DATETIME (统计时间)
  - time_granularity: ENUM('hour', 'day')
  - pv: BIGINT (浏览量)
  - uv: BIGINT (独立访客)
  - error_count: BIGINT
  - performance_index: JSON
  - create_time: DATETIME

【字段归属判断】
- 页面URL (v_page_url) → 【仅】buried_point_data 表有
- 错误类型 (v_error_type) → 【仅】buried_point_data 表有
- 浏览量 (pv) / 独立访客 (uv) → 【仅】statistics 表有
- stat_time → 【仅】statistics 表有
- event_time → 【仅】buried_point_data 表有

【重要规则】
1. 【强制】必须在 WHERE 中带上 project_id = {projectId}
2. 【强制】只能生成 SELECT 语句，禁止 INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER
3. 【强制】不要加分号
4. 【强制】查询中使用的每个字段必须属于所查的表，严禁跨表混用字段
5. 【强制】查询页面URL必须用 buried_point_data 表 + v_page_url 字段
6. 【强制】查询 pv/uv 统计必须用 statistics 表
7. 【强制】buried_point_data 时间用 event_time（毫秒戳）；statistics 时间用 stat_time（DATETIME）
8. 【建议】统计类查询优先使用 statistics 表，明细查询使用 buried_point_data 表
9. 【建议】buried_point_data 查询必须带上 event_time 范围以利用分区裁剪
10. 【建议】结果默认 LIMIT 100

用户问题：{question}

请生成对应的 SQL 查询语句，只返回 SQL 语句，不要包含任何其他内容（如 markdown 代码块标记）。`;

    const finalPrompt = sqlTemplate.replace(/{projectId}/g, request.projectId.toString());

    const prompt = await PromptTemplate.fromTemplate(finalPrompt);
    const chain = prompt.pipe(this.llm);

    const result = await chain.invoke({ question: request.question });
    let sql = (result.content as string).trim();

    // 去除可能的 markdown 代码块标记
    sql = sql
      .replace(/^```sql\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

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
    projectId: number,
  ): Promise<Array<Record<string, any>>> {
    let cleanSql = sql.trim();
    cleanSql = cleanSql.replace(/;$/, '');
    const normalizedSql = cleanSql.toLowerCase();

    // 强制自动注入 project_id（防止AI不听话）
    const hasProjectId = /project_id\s*=/.test(cleanSql);
    if (!hasProjectId) {
      if (normalizedSql.includes('where')) {
        cleanSql += ` AND project_id = ${projectId}`;
      } else {
        cleanSql += ` WHERE project_id = ${projectId}`;
      }
    }

    // 白名单：只允许查询特定表
    const allowedTables = ['buried_point_data', 'statistics'];
    const tableMatches = cleanSql.match(/from\s+(\w+)/gi) || [];
    for (const match of tableMatches) {
      const tableName = match
        .replace(/from\s+/i, '')
        .trim()
        .toLowerCase();
      if (!allowedTables.includes(tableName)) {
        throw new Error(`不允许查询表：${tableName}，只允许查询：${allowedTables.join(', ')}`);
      }
    }

    // 禁止危险操作
    const forbiddenKeywords = [
      'drop',
      'delete',
      'update',
      'insert',
      'truncate',
      'alter',
      'create',
      'grant',
      'revoke',
    ];
    for (const keyword of forbiddenKeywords) {
      if (normalizedSql.includes(keyword)) {
        throw new Error('只允许 SELECT 查询');
      }
    }

    const limitedSql = normalizedSql.includes('limit') ? cleanSql : `${cleanSql} LIMIT 100`;

    try {
      const results = await this.prismaService.$queryRawUnsafe(limitedSql);
      return this.convertBigIntToNumber(results);
    } catch (error) {
      const err = error as Error;
      throw new Error(`查询执行失败：${err.message}`);
    }
  }

  private convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertBigIntToNumber(item));
    }
    if (typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        result[key] = this.convertBigIntToNumber(obj[key]);
      }
      return result;
    }
    return obj;
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
