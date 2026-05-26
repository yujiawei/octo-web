import React, { useState, useCallback, useRef, useMemo, type DragEvent } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Definition, NodeDef, EdgeDef, NodeType } from '../types';
import { NODE_TYPE_COLORS } from '../types';
import TriggerNode from './custom-nodes/TriggerNode';
import ScriptNode from './custom-nodes/ScriptNode';
import HttpNode from './custom-nodes/HttpNode';
import ConditionNode from './custom-nodes/ConditionNode';
import HumanNode from './custom-nodes/HumanNode';
import NodeSidebar from './NodeSidebar';
import NodeConfigPanel from './NodeConfigPanel';

// Register custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  script: ScriptNode,
  http: HttpNode,
  condition: ConditionNode,
  human_action: HumanNode,
};

// Convert backend Definition → React Flow format
export function definitionToFlow(def: Definition): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = (def.nodes || []).map((n) => ({
    id: n.id,
    type: n.type === 'bot_action' ? 'script' : n.type,
    position: n.position || { x: 250, y: 0 },
    data: {
      label: n.label || n.type,
      nodeType: n.type,
      ...n.config,
    },
  }));

  // Auto-layout if positions are all zero
  const allZero = nodes.every((n) => n.position.x === 0 && n.position.y === 0);
  if (allZero) {
    nodes.forEach((n, i) => {
      n.position = { x: 250, y: i * 150 + 50 };
    });
  }

  // Add trigger nodes
  (def.triggers || []).forEach((t, i) => {
    nodes.unshift({
      id: `trigger-${t.id}`,
      type: 'trigger',
      position: { x: 250, y: -(i + 1) * 150 },
      data: {
        label: t.type.charAt(0).toUpperCase() + t.type.slice(1) + ' Trigger',
        triggerType: t.type,
        nodeType: 'trigger',
        config: t.config,
      },
    });
  });

  const edges: Edge[] = (def.edges || []).map((e, i) => ({
    id: `e-${e.from}-${e.to}-${i}`,
    source: e.from,
    target: e.to,
    sourceHandle: e.branch || undefined,
    label: e.label || e.condition || undefined,
    animated: false,
    style: { strokeWidth: 2 },
  }));

  return { nodes, edges };
}

// Convert React Flow format → backend Definition
export function flowToDefinition(
  nodes: Node[],
  edges: Edge[],
  existingDef?: Partial<Definition>,
): Definition {
  const triggerNodes = nodes.filter((n) => n.type === 'trigger');
  const normalNodes = nodes.filter((n) => n.type !== 'trigger');

  const nodeDefs: NodeDef[] = normalNodes.map((n) => {
    const { label, nodeType, ...config } = n.data as Record<string, any>;
    return {
      id: n.id,
      type: (nodeType || n.type) as NodeType,
      label: label as string,
      config,
      position: n.position,
    };
  });

  const edgeDefs: EdgeDef[] = edges.map((e) => ({
    from: e.source,
    to: e.target,
    branch: e.sourceHandle || undefined,
    label: (e.label as string) || undefined,
  }));

  const triggers = triggerNodes.map((n) => ({
    id: n.id.replace('trigger-', ''),
    type: (n.data as any).triggerType || 'manual',
    config: (n.data as any).config || {},
  }));

  return {
    nodes: nodeDefs,
    edges: edgeDefs,
    triggers,
    concurrency: existingDef?.concurrency,
    variables: existingDef?.variables,
  };
}

interface FlowEditorProps {
  initialDefinition?: Definition;
  onDefinitionChange?: (def: Definition) => void;
  readOnly?: boolean;
  className?: string;
}

let nodeIdCounter = 0;
function getNodeId() {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

const FlowEditor: React.FC<FlowEditorProps> = ({
  initialDefinition,
  onDefinitionChange,
  readOnly = false,
  className,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const initial = useMemo(
    () =>
      initialDefinition
        ? definitionToFlow(initialDefinition)
        : { nodes: [], edges: [] },
    [initialDefinition],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: false, style: { strokeWidth: 2 } }, eds));
    },
    [setEdges],
  );

  // Drop handler: add node from sidebar
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/dmworkflow-node');
      if (!raw || !reactFlowInstance || !reactFlowWrapper.current) return;

      const { type, label, icon } = JSON.parse(raw) as {
        type: NodeType;
        label: string;
        icon: string;
      };

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: { label, icon, nodeType: type },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes],
  );

  // Node click → open config panel
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Update node data from config panel
  const onNodeUpdate = useCallback(
    (id: string, data: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
      );
      setSelectedNode(null);
    },
    [setNodes],
  );

  // Expose definition changes
  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // We can't read the updated nodes synchronously here; parent uses getDefinition()
    },
    [onNodesChange],
  );

  // Public method: get current definition
  // Exposed via ref or called by parent
  const getDefinition = useCallback(
    (): Definition => flowToDefinition(nodes, edges, initialDefinition),
    [nodes, edges, initialDefinition],
  );

  // Notify parent on changes
  React.useEffect(() => {
    if (onDefinitionChange) {
      onDefinitionChange(getDefinition());
    }
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flow-editor ${className || ''}`}>
      {!readOnly && <NodeSidebar />}
      <div
        className="flow-editor__canvas"
        ref={reactFlowWrapper}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : handleNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onNodeClick={readOnly ? undefined : onNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={readOnly ? null : 'Delete'}
          snapToGrid
          snapGrid={[16, 16]}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => NODE_TYPE_COLORS[n.type || ''] || '#999'}
            nodeColor={(n) => {
              const c = NODE_TYPE_COLORS[n.type || ''] || '#eee';
              return c + '33'; // 20% opacity
            }}
            style={{ backgroundColor: '#f8f9fa' }}
          />
        </ReactFlow>
      </div>
      {!readOnly && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={onNodeUpdate}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default FlowEditor;
export { getNodeId };
