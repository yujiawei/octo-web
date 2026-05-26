import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface TriggerNodeData {
  label: string;
  triggerType?: 'webhook' | 'cron' | 'manual' | 'message' | 'event';
  config?: Record<string, any>;
  [key: string]: unknown;
}

const TRIGGER_ICONS: Record<string, string> = {
  webhook: '⚡',
  cron: '⏰',
  manual: '👆',
  message: '💬',
  event: '📡',
};

const TriggerNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as TriggerNodeData;
  const triggerType = nodeData.triggerType || 'manual';
  const icon = TRIGGER_ICONS[triggerType] || '⚡';

  const getSummary = () => {
    const cfg = nodeData.config || {};
    switch (triggerType) {
      case 'webhook':
        return cfg.path ? `POST ${cfg.path}` : 'Webhook endpoint';
      case 'cron':
        return cfg.expression || 'No schedule set';
      case 'manual':
        return 'Click to run';
      case 'message':
        return cfg.pattern || 'Message trigger';
      case 'event':
        return cfg.event_type || 'Event trigger';
      default:
        return triggerType;
    }
  };

  return (
    <div
      className={`flow-node flow-node--trigger ${selected ? 'flow-node--selected' : ''}`}
      style={{ borderColor: '#3B82F6' }}
    >
      <div className="flow-node__header" style={{ backgroundColor: '#3B82F6' }}>
        <span className="flow-node__icon">{icon}</span>
        <span className="flow-node__label">{nodeData.label || 'Trigger'}</span>
      </div>
      <div className="flow-node__body">
        <span className="flow-node__summary">{getSummary()}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="flow-handle" />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;
