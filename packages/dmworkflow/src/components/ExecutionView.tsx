import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import type { Execution, NodeExecution, NODE_EXEC_STATUS_COLORS } from '../types';

interface ExecutionViewProps {
  execution: Execution;
  className?: string;
}

// Map execution status to node border color
const statusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return '#10B981';
    case 'failed':
      return '#EF4444';
    case 'running':
      return '#3B82F6';
    case 'skipped':
      return '#6B7280';
    default:
      return '#9CA3AF';
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return '⏳ Pending';
    case 'running':
      return '🔄 Running';
    case 'waiting':
      return '⏸ Waiting';
    case 'success':
      return '✅ Success';
    case 'failed':
      return '❌ Failed';
    case 'cancelled':
      return '🚫 Cancelled';
    case 'skipped':
      return '⏭ Skipped';
    default:
      return status;
  }
};

const formatDuration = (start: string | null, end: string | null): string => {
  if (!start) return '-';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const ExecutionView: React.FC<ExecutionViewProps> = ({ execution, className }) => {
  const [selectedNode, setSelectedNode] = useState<NodeExecution | null>(null);

  const nodeExecMap = useMemo(() => {
    const map = new Map<string, NodeExecution>();
    (execution.nodes || []).forEach((ne) => map.set(ne.node_id, ne));
    return map;
  }, [execution.nodes]);

  // Build React Flow nodes from execution data
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = (execution.nodes || []).map((ne, idx) => ({
      id: ne.node_id,
      type: 'default',
      position: { x: 250, y: idx * 120 + 50 },
      data: {
        label: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600 }}>{ne.node_type}</div>
            <div style={{ fontSize: 11, color: statusColor(ne.status) }}>
              {statusLabel(ne.status)}
            </div>
          </div>
        ),
      },
      style: {
        border: `2px solid ${statusColor(ne.status)}`,
        borderRadius: 8,
        padding: 8,
        background: ne.status === 'running' ? '#EFF6FF' : '#fff',
      },
    }));

    // Simple sequential edges for now
    const flowEdges: Edge[] = [];
    for (let i = 0; i < flowNodes.length - 1; i++) {
      flowEdges.push({
        id: `exec-edge-${i}`,
        source: flowNodes[i].id,
        target: flowNodes[i + 1].id,
        animated: (execution.nodes || [])[i].status === 'running',
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [execution.nodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const ne = nodeExecMap.get(node.id);
      setSelectedNode(ne || null);
    },
    [nodeExecMap],
  );

  return (
    <div className={`execution-view ${className || ''}`}>
      {/* Header */}
      <div className="execution-view__header">
        <div className="execution-view__meta">
          <span className="execution-view__status" style={{ color: statusColor(execution.status) }}>
            {statusLabel(execution.status)}
          </span>
          <span className="execution-view__duration">
            {formatDuration(execution.started_at, execution.finished_at)}
          </span>
          {execution.error && (
            <span className="execution-view__error" title={execution.error}>
              ❌ {execution.error.slice(0, 80)}
            </span>
          )}
        </div>
        <div className="execution-view__id">ID: {execution.id}</div>
      </div>

      {/* Flow Canvas */}
      <div className="execution-view__canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Node detail side panel */}
      {selectedNode && (
        <div className="execution-view__detail">
          <div className="execution-view__detail-header">
            <h4>{selectedNode.node_type} — {selectedNode.node_id}</h4>
            <button onClick={() => setSelectedNode(null)}>✕</button>
          </div>
          <div className="execution-view__detail-body">
            <div className="execution-view__detail-section">
              <h5>Status</h5>
              <span style={{ color: statusColor(selectedNode.status) }}>
                {statusLabel(selectedNode.status)}
              </span>
              <span className="execution-view__detail-time">
                {formatDuration(selectedNode.started_at, selectedNode.finished_at)}
              </span>
            </div>
            {selectedNode.input != null && (
              <div className="execution-view__detail-section">
                <h5>Input</h5>
                <pre className="execution-view__json">
                  {JSON.stringify(selectedNode.input, null, 2)}
                </pre>
              </div>
            )}
            {selectedNode.output != null && (
              <div className="execution-view__detail-section">
                <h5>Output</h5>
                <pre className="execution-view__json">
                  {JSON.stringify(selectedNode.output, null, 2)}
                </pre>
              </div>
            )}
            {selectedNode.error && (
              <div className="execution-view__detail-section">
                <h5>Error</h5>
                <pre className="execution-view__json execution-view__json--error">
                  {selectedNode.error}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionView;
