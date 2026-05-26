import React, { useState, useCallback } from 'react';
import type { FlowStatus } from '../types';

interface FlowToolbarProps {
  name: string;
  status: FlowStatus;
  saving?: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onRun: () => void;
  onHistory: () => void;
}

const STATUS_BADGES: Record<FlowStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#9CA3AF' },
  active: { label: '已激活', color: '#10B981' },
  archived: { label: '已归档', color: '#6B7280' },
};

const FlowToolbar: React.FC<FlowToolbarProps> = ({
  name,
  status,
  saving,
  onNameChange,
  onSave,
  onActivate,
  onDeactivate,
  onRun,
  onHistory,
}) => {
  const [editing, setEditing] = useState(false);
  const [localName, setLocalName] = useState(name);

  const commitName = useCallback(() => {
    setEditing(false);
    if (localName.trim() && localName !== name) {
      onNameChange(localName.trim());
    } else {
      setLocalName(name);
    }
  }, [localName, name, onNameChange]);

  const badge = STATUS_BADGES[status];

  return (
    <div className="flow-toolbar">
      <div className="flow-toolbar__left">
        {editing ? (
          <input
            className="flow-toolbar__name-input"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setLocalName(name);
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <h2
            className="flow-toolbar__name"
            onClick={() => {
              setLocalName(name);
              setEditing(true);
            }}
            title="Click to rename"
          >
            {name}
          </h2>
        )}
        <span
          className="flow-toolbar__status"
          style={{ backgroundColor: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      <div className="flow-toolbar__actions">
        <button
          className="flow-toolbar__btn flow-toolbar__btn--primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? '保存中…' : '💾 保存'}
        </button>

        {status === 'draft' || status === 'archived' ? (
          <button className="flow-toolbar__btn flow-toolbar__btn--success" onClick={onActivate}>
            ▶ 激活
          </button>
        ) : (
          <button className="flow-toolbar__btn flow-toolbar__btn--warning" onClick={onDeactivate}>
            ⏸ 停用
          </button>
        )}

        <button
          className="flow-toolbar__btn"
          onClick={onRun}
          disabled={status !== 'active'}
          title={status !== 'active' ? '需要先激活' : '手动触发运行'}
        >
          🚀 运行
        </button>

        <button className="flow-toolbar__btn" onClick={onHistory}>
          📋 执行历史
        </button>
      </div>
    </div>
  );
};

export default FlowToolbar;
