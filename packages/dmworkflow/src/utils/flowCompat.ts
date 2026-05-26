import type { Node, Edge } from '@xyflow/react';

interface NodeDef {
  id: string;
  type: string;
  label?: string;
  position?: { x: number; y: number };
  config: Record<string, any>;
}

interface EdgeDef {
  from: string;
  to: string;
  branch?: string;
  condition?: string;
}

interface Definition {
  nodes: NodeDef[];
  edges: EdgeDef[];
  triggers?: any[];
  concurrency?: any;
  variables?: Record<string, any>;
}

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

  const allZero = nodes.every((n) => n.position.x === 0 && n.position.y === 0);
  if (allZero) {
    nodes.forEach((n, i) => {
      n.position = { x: 250, y: i * 150 + 50 };
    });
  }

  const edges: Edge[] = (def.edges || [])
    .filter((e) => e.from && e.to && e.to !== '__end__' && e.from !== '__start__')
    .map((e, i) => ({
      id: `e-${e.from}-${e.to}-${i}`,
      source: e.from,
      target: e.to,
      label: e.branch || undefined,
      animated: !!e.condition,
    }));

  return { nodes, edges };
}
