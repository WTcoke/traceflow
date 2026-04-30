export enum AiMode {
  CHAIN = 'chain',
  RAG = 'rag',
  AGENT = 'agent',
}

export enum AiAnalysisType {
  STATISTICS = 'statistics',
  ERROR_ANALYSIS = 'error_analysis',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  BEHAVIOR_ANALYSIS = 'behavior_analysis',
  SPEC_VALIDATION = 'spec_validation',
  ANOMALY_DETECTION = 'anomaly_detection',
  NATURAL_QUERY = 'natural_query',
}

export interface AiAnalysisResult {
  id?: bigint;
  projectId: bigint;
  analysisType: string;
  analysisData: Record<string, any>;
  sqlLog?: string;
  createTime?: Date;
}

export interface AiQueryRequest {
  projectId: bigint;
  question: string;
}

export interface AiQueryResponse {
  sql: string;
  result: Array<Record<string, any>>;
  explanation: string;
}

export interface AiAnalyzeRequest {
  projectId: bigint;
  analysisType: string;
  data?: {
    startTime?: number;
    endTime?: number;
    eventTypes?: string[];
    dataTypes?: Record<string, any>;
  };
  options?: Record<string, any>;
}

export interface AiAnalyzeResponse {
  taskId: string;
}

export interface AiResultsQueryRequest {
  projectId: bigint;
  analysisType?: string;
  pageNum: number;
  pageSize: number;
}

export interface AiResultsResponse {
  total: number;
  list: Array<{
    id: bigint;
    analysisType: string;
    analysisData: Record<string, any>;
    sqlLog?: string;
    createTime: number;
  }>;
}

export interface AiLogEntry {
  id?: bigint;
  projectId: bigint;
  userId?: bigint;
  mode: AiMode;
  analysisType: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costTime: number;
  status: 'success' | 'failed';
  errorMsg?: string;
  createTime?: Date;
}

export interface CacheOptions {
  ttlSeconds: number;
  keyPrefix: string;
}

export const DEFAULT_CACHE_TTL = 600;
export const LONG_CACHE_TTL = 86400;

export const CACHE_KEYS = {
  AI_QUERY: 'ai:query',
  AI_RESULT: 'ai:result',
  AI_STATS: 'ai:stats',
};
