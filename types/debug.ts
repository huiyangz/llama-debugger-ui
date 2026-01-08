export type DebugGranularity = 'token' | 'layer' | 'operation';

export interface DebugState {
  enabled: boolean;
  paused: boolean;
  granularity: DebugGranularity;
}

export interface TokenInfo {
  id: number;
  text: string;
  position: number;
  rawContent?: string; // 原始内容
}

export interface DebugResponse {
  status: string;
  error?: string;
  enabled?: boolean;
  paused?: boolean;
  granularity?: DebugGranularity;
}
