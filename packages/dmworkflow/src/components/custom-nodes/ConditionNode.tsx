import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface ConditionNodeData {
  label: string;
  expression?: string;
  branches?: { id: string; label: string; condition?: string }[];
  [key: string]: unknown;
}

const ConditionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as ConditionNodeData;
  const expression = nodeData.expression || 'No condition set';
  const branches = nodeData.branches || [
    { id: 'true', label: 'True' },
    { id: 'false', label: 'False' },
  ];

  return (
    <div
      className={`flow-node flow-node--condition ${selected ? 'flow-node--selected' : ''}`}
      style={{ borderColor: '#8B5CF6' }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <div className="flow-node__header" style={{ backgroundColor: '#8B5CF6' }}>
        <span className="flow-node__icon">🔀</span>
        <span className="flow-node__label">{nodeData.label || 'Condition'}</span>
      </div>
      <div className="flow-node__body">
        <code className="flow-node__expression">{expression}</code>
        <div className="flow-node__branches">
          {branches.map((b, i) => (
            <span key={b.id} className="flow-node__branch-tag">
              {b.label}
            </span>
          ))}
        </div>
      </div>
      {branches.map((b, i) => (
        <Handle
          key={b.id}
          type="source"
          position={Position.Bottom}
          id={b.id}
          className="flow-handle"
          style={{
            left: `${((i + 1) / (branches.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;
