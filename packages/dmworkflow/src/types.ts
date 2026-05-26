// Flow definition types matching backend API

export interface FlowDef {
  id: string;
  space_id: string;
  name: string;
  description: string;
  definition: Definition;
  version: number;
  status: FlowStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type FlowStatus = 'draft' | 'active' | 'archived';

export interface Definition {
  nodes: NodeDef[];
  edges: EdgeDef[];
  triggers?: TriggerDef[];
  concurrency?: { scope: string; strategy: string };
  variables?: Record<string, string>;
}

export interface NodeDef {
  id: string;
  type: NodeType;
  label?: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

export type NodeType =
  | 'trigger'
  | 'script'
  | 'http'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'bot_action'
  | 'human_action'
  | 'subflow';

export interface EdgeDef {
  from: string;
  to: string;
  condition?: string;
  branch?: string;
  label?: string;
}

export interface TriggerDef {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
}

export type TriggerType = 'webhook' | 'cron' | 'manual' | 'message' | 'event';

export interface Execution {
  id: string;
  flow_id: string;
  trigger_id: string;
  status: ExecutionStatus;
  context: Record<string, any>;
  scope_key: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  nodes?: NodeExecution[];
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface NodeExecution {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  status: NodeExecutionStatus;
  input: any;
  output: any;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped';

// Node palette categories
export interface NodeCategory {
  label: string;
  color: string;
  items: NodeCategoryItem[];
}

export interface NodeCategoryItem {
  type: NodeType;
  label: string;
  icon: string;
  disabled?: boolean;
  /**
   * For trigger items, the concrete trigger flavour (webhook / cron / manual / ...).
   * Used by the editor to pre-populate `data.triggerType` on drop so dropped
   * trigger nodes carry the right kind instead of all collapsing to one.
   */
  triggerType?: TriggerType;
}

export const NODE_CATEGORIES: NodeCategory[] = [
  {
    label: '触发器',
    color: '#3B82F6',
    items: [
      { type: 'trigger', label: 'Webhook', icon: '⚡', triggerType: 'webhook' },
      { type: 'trigger', label: 'Cron', icon: '⏰', triggerType: 'cron' },
      { type: 'trigger', label: '手动触发', icon: '👆', triggerType: 'manual' },
    ],
  },
  {
    label: '动作',
    color: '#10B981',
    items: [
      { type: 'script', label: 'Script', icon: '📝' },
      { type: 'http', label: 'HTTP 请求', icon: '🌐' },
      { type: 'bot_action', label: 'Bot 动作', icon: '🤖', disabled: true },
    ],
  },
  {
    label: '逻辑',
    color: '#8B5CF6',
    items: [
      { type: 'condition', label: '条件分支', icon: '🔀' },
      { type: 'parallel', label: '并行', icon: '⚡', disabled: true },
    ],
  },
  {
    label: '人工',
    color: '#F59E0B',
    items: [
      { type: 'human_action', label: '人工审批', icon: '👤', disabled: true },
    ],
  },
];

// Color mapping for node types
export const NODE_TYPE_COLORS: Record<string, string> = {
  script: '#10B981',
  http: '#10B981',
  condition: '#8B5CF6',
  parallel: '#8B5CF6',
  loop: '#8B5CF6',
  bot_action: '#10B981',
  human_action: '#F59E0B',
  subflow: '#6366F1',
  trigger: '#3B82F6',
};

// Execution status colors
export const EXEC_STATUS_COLORS: Record<ExecutionStatus, string> = {
  pending: '#9CA3AF',
  running: '#3B82F6',
  waiting: '#F59E0B',
  success: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
};

export const NODE_EXEC_STATUS_COLORS: Record<NodeExecutionStatus, string> = {
  pending: '#9CA3AF',
  running: '#3B82F6',
  success: '#10B981',
  failed: '#EF4444',
  skipped: '#6B7280',
};
