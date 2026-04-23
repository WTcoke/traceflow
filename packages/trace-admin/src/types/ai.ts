// AI 推荐卡片类型
export interface AiSuggestion {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  actionText?: string;
  actionType?: 'navigate' | 'modal' | 'copy';
  relatedMetricKey?: string;
  visible: boolean;
}
