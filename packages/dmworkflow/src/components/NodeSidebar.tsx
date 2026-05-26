import React, { useState, useCallback, type DragEvent } from 'react';
import { NODE_CATEGORIES, type NodeCategoryItem } from '../types';

interface NodeSidebarProps {
  className?: string;
}

const NodeSidebar: React.FC<NodeSidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = useCallback((label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const onDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, item: NodeCategoryItem) => {
      if (item.disabled) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(
        'application/dmworkflow-node',
        // triggerType travels with the payload so the editor can distinguish
        // webhook / cron / manual triggers when constructing the dropped node.
        JSON.stringify({
          type: item.type,
          label: item.label,
          icon: item.icon,
          triggerType: item.triggerType,
        }),
      );
      event.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  return (
    <aside className={`flow-sidebar ${className || ''}`}>
      <div className="flow-sidebar__header">
        <h3 className="flow-sidebar__title">节点</h3>
      </div>
      <div className="flow-sidebar__categories">
        {NODE_CATEGORIES.map((cat) => (
          <div key={cat.label} className="flow-sidebar__category">
            <button
              className="flow-sidebar__category-header"
              onClick={() => toggleCategory(cat.label)}
              style={{ borderLeftColor: cat.color }}
            >
              <span>{cat.label}</span>
              <span className="flow-sidebar__chevron">
                {collapsed[cat.label] ? '▶' : '▼'}
              </span>
            </button>
            {!collapsed[cat.label] && (
              <div className="flow-sidebar__items">
                {cat.items.map((item) => (
                  <div
                    key={`${item.type}-${item.label}`}
                    className={`flow-sidebar__item ${item.disabled ? 'flow-sidebar__item--disabled' : ''}`}
                    draggable={!item.disabled}
                    onDragStart={(e) => onDragStart(e, item)}
                    title={item.disabled ? 'Phase 2' : `拖拽添加 ${item.label}`}
                  >
                    <span className="flow-sidebar__item-icon">{item.icon}</span>
                    <span className="flow-sidebar__item-label">{item.label}</span>
                    {item.disabled && (
                      <span className="flow-sidebar__item-badge">P2</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default NodeSidebar;
