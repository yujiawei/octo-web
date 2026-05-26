import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface HumanNodeData {
  label: string;
  assignee?: string;
  prompt?: string;
  timeout_hours?: number;
  [key: string]: unknown;
}

const HumanNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as HumanNodeData;

  return (
    <div
      className={`flow-node flow-node--human ${selected ? 'flow-node--selected' : ''}`}
      style={{ borderColor: '#F59E0B' }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <div className="flow-node__header" style={{ backgroundColor: '#F59E0B' }}>
        <span className="flow-node__icon">👤</span>
        <span className="flow-node__label">{nodeData.label || 'Human Action'}</span>
      </div>
      <div className="flow-node__body">
        {nodeData.assignee && (
          <div className="flow-node__assignee">
            <span className="flow-node__tag">👤 {nodeData.assignee}</span>
          </div>
        )}
        <span className="flow-node__summary">
          {nodeData.prompt || 'Waiting for approval'}
        </span>
        {nodeData.timeout_hours && (
          <span className="flow-node__tag">⏱ {nodeData.timeout_hours}h timeout</span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="approved"
        className="flow-handle"
        style={{ left: '33%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="rejected"
        className="flow-handle"
        style={{ left: '66%' }}
      />
    </div>
  );
});

HumanNode.displayName = 'HumanNode';

export default HumanNode;
