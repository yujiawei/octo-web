import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface HttpNodeData {
  label: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  [key: string]: unknown;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#10B981',
  POST: '#3B82F6',
  PUT: '#F59E0B',
  PATCH: '#8B5CF6',
  DELETE: '#EF4444',
};

const HttpNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as HttpNodeData;
  const method = (nodeData.method || 'GET').toUpperCase();
  const url = nodeData.url || 'No URL set';
  const truncatedUrl = url.length > 35 ? url.slice(0, 35) + '…' : url;

  return (
    <div
      className={`flow-node flow-node--http ${selected ? 'flow-node--selected' : ''}`}
      style={{ borderColor: '#10B981' }}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <div className="flow-node__header" style={{ backgroundColor: '#10B981' }}>
        <span className="flow-node__icon">🌐</span>
        <span className="flow-node__label">{nodeData.label || 'HTTP Request'}</span>
      </div>
      <div className="flow-node__body">
        <div className="flow-node__http-method">
          <span
            className="flow-node__method-badge"
            style={{ backgroundColor: METHOD_COLORS[method] || '#6B7280' }}
          >
            {method}
          </span>
          <span className="flow-node__url">{truncatedUrl}</span>
        </div>
        {nodeData.headers && Object.keys(nodeData.headers).length > 0 && (
          <span className="flow-node__tag">
            {Object.keys(nodeData.headers).length} header(s)
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="flow-handle" />
    </div>
  );
});

HttpNode.displayName = 'HttpNode';

export default HttpNode;
