// src/types/index.ts

export type TraceEventType = 'performance' | 'behavior' | 'routing' | 'error' | 'custom';

export interface TraceEvent {
  type: TraceEventType;
  name: string;
  time: number;
  url: string;
  data: any;
}

export interface PluginContext {
  report: (event: Omit<TraceEvent, 'time' | 'url'>) => void;
  getConfig: () => any;
}

export interface TracePlugin {
  name: string;
  install: (ctx: PluginContext) => void;
  uninstall?: () => void;
}
