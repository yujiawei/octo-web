import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface ScriptNodeData {
  label: string;
  language?: string;
  code?: string;
  timeout?: number;
  [key: string]: unknown;
}

const ScriptNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as ScriptNodeData;
  const lang = nodeData.language || 'javascript';
  const codePreview = nodeData.code
    ? nodeData.code.split('\n')[0].slice(0, 40) + (nodeData.code.length > 40 ? '…' : '')
    : 'No script';

  return (
    <div
      className={`flow-node flow-node--script ${selected ? 'flow-node--selected' : ''}`}
      style={{ borderColor: '#10B981' }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <div className="flow-node__header" style={{ backgroundColor: '#10B981' }}>
        <span className="flow-node__icon">📝</span>
        <span className="flow-node__label">{nodeData.label || 'Script'}</span>
      </div>
      <div className="flow-node__body">
        <code className="flow-node__code-preview">{codePreview}</code>
        <div className="flow-node__meta">
          <span className="flow-node__tag">{lang}</span>
          {nodeData.timeout && (
            <span className="flow-node__tag">⏱ {nodeData.timeout}s</span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="flow-handle" />
    </div>
  );
});

ScriptNode.displayName = 'ScriptNode';

export default ScriptNode;
