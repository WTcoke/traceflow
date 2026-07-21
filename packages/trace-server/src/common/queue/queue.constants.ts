export const QUEUE_NAMES = {
  BURIED_POINT: 'buried_point_queue',
};

export const QUEUE_CONFIG = {
  DEFAULT_RETRY_DELAY: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  MAX_QUEUE_LENGTH: 100000,
  QUEUE_WARNING_THRESHOLD: 50000,
};

export interface BuriedPointJobData {
  projectId: bigint;
  rawBody: string;
  items: Array<{
    msgId: string;
    deviceId: string;
    userId?: string;
    eventTime: number;
    eventType: 'behavior' | 'performance' | 'error';
    platform: string;
    userAgent?: string;
    ip?: string;
    os?: string;
    browser?: string;
    country?: string;
    province?: string;
    city?: string;
    data: Record<string, any>;
  }>;
}
