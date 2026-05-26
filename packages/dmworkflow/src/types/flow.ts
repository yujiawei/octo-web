// Types for the Flow module
export type { FlowDef as Flow, FlowStatus } from '../types';
export type { FlowDef, Definition as FlowDefinition } from '../types';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

// Execution type alias
export interface FlowExecution {
  id: string;
  flow_id: string;
  trigger_id?: string;
  status: ExecutionStatus;
  context?: string;
  error?: string;
  scope_key?: string;
  started_at?: string;
  finished_at?: string;
}

// API response wrappers
export interface ListFlowsResponse {
  items: import('../types').FlowDef[];
  count: number;
}

export interface ListExecutionsResponse {
  items: FlowExecution[];
  count: number;
}
