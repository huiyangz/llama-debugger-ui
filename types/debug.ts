export type DebugGranularity = 'token' | 'layer' | 'operation';

export interface DebugState {
  enabled: boolean;
  paused: boolean;
  granularity: DebugGranularity;
  currentLayer?: number;
  currentNode?: string;
  currentOp?: string;
  currentInputs?: string;
}

export interface TokenInfo {
  id: number;
  text: string;
  position: number;
  rawContent?: string;
}

export interface DebugResponse {
  status: string;
  error?: string;
  enabled?: boolean;
  paused?: boolean;
  granularity?: number | DebugGranularity;
  current_layer?: number;
  current_node?: string;
  current_op?: string;
  current_inputs?: string;
}
