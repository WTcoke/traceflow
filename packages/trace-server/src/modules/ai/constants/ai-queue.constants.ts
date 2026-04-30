export const AI_QUEUE_NAMES = {
  AI_ANALYSIS: 'ai_analysis_queue',
};

export const AI_QUEUE_CONFIG = {
  DEFAULT_RETRY_DELAY: 2000,
  MAX_RETRY_ATTEMPTS: 3,
  ANALYSIS_TIMEOUT: 60000,
};

export interface AiAnalysisJobData {
  taskId: string;
  projectId: bigint;
  analysisType: string;
  data?: {
    startTime?: number;
    endTime?: number;
    eventTypes?: string[];
    dataTypes?: Record<string, any>;
  };
  options?: Record<string, any>;
  userId?: bigint;
}
