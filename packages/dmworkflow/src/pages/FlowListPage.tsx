import React, { useState, useEffect, useCallback } from 'react';
import { flowApi } from '../api';
import type { FlowDef, FlowStatus } from '../types';

interface FlowListPageProps {
  spaceId?: string;
  onEdit: (flowId: string) => void;
  onHistory: (flowId: string) => void;
  onCreate: (flow: FlowDef) => void;
}

const STATUS_BADGE: Record<FlowStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'flow-badge flow-badge--draft' },
  active: { label: '已激活', className: 'flow-badge flow-badge--active' },
  archived: { label: '已归档', className: 'flow-badge flow-badge--archived' },
};

const FlowListPage: React.FC<FlowListPageProps> = ({
  spaceId,
  onEdit,
  onHistory,
  onCreate,
}) => {
  const [flows, setFlows] = useState<FlowDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await flowApi.list(spaceId, filterStatus || undefined);
      setFlows(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load flows');
    } finally {
      setLoading(false);
    }
  }, [spaceId, filterStatus]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const handleCreate = useCallback(async () => {
    try {
      const flow = await flowApi.create({
        space_id: spaceId || '',
        name: 'Untitled Flow',
        description: '',
        definition: { nodes: [], edges: [], triggers: [] },
      });
      onCreate(flow);
    } catch (err: any) {
      setError(err.message || 'Failed to create flow');
    }
  }, [spaceId, onCreate]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('确认删除此 Flow？此操作不可撤销。')) return;
      setDeleting(id);
      try {
        await flowApi.delete(id);
        setFlows((prev) => prev.filter((f) => f.id !== id));
      } catch (err: any) {
        setError(err.message || 'Failed to delete flow');
      } finally {
        setDeleting(null);
      }
    },
    [],
  );

  const handleToggleActive = useCallback(
    async (flow: FlowDef) => {
      try {
        if (flow.status === 'active') {
          await flowApi.deactivate(flow.id);
        } else {
          await flowApi.activate(flow.id);
        }
        loadFlows();
      } catch (err: any) {
        setError(err.message || 'Failed to toggle flow status');
      }
    },
    [loadFlows],
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flow-list-page">
      <div className="flow-list-page__header">
        <h1 className="flow-list-page__title">Flows</h1>
        <div className="flow-list-page__actions">
          <select
            className="flow-list-page__filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">已激活</option>
            <option value="archived">已归档</option>
          </select>
          <button className="flow-list-page__btn flow-list-page__btn--primary" onClick={handleCreate}>
            + 新建 Flow
          </button>
        </div>
      </div>

      {error && (
        <div className="flow-list-page__error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="flow-list-page__loading">加载中…</div>
      ) : flows.length === 0 ? (
        <div className="flow-list-page__empty">
          <p>暂无 Flow</p>
          <button className="flow-list-page__btn flow-list-page__btn--primary" onClick={handleCreate}>
            创建第一个 Flow
          </button>
        </div>
      ) : (
        <table className="flow-list-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>状态</th>
              <th>版本</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {flows.map((flow) => {
              const badge = STATUS_BADGE[flow.status] || STATUS_BADGE.draft;
              return (
                <tr key={flow.id}>
                  <td>
                    <button
                      className="flow-list-table__name"
                      onClick={() => onEdit(flow.id)}
                    >
                      {flow.name}
                    </button>
                    {flow.description && (
                      <span className="flow-list-table__desc">{flow.description}</span>
                    )}
                  </td>
                  <td>
                    <span className={badge.className}>{badge.label}</span>
                  </td>
                  <td>v{flow.version}</td>
                  <td>{formatDate(flow.created_at)}</td>
                  <td>{formatDate(flow.updated_at)}</td>
                  <td className="flow-list-table__actions">
                    <button onClick={() => onEdit(flow.id)} title="编辑">✏️</button>
                    <button onClick={() => handleToggleActive(flow)} title={flow.status === 'active' ? '停用' : '激活'}>
                      {flow.status === 'active' ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => onHistory(flow.id)} title="执行历史">📋</button>
                    <button
                      onClick={() => handleDelete(flow.id)}
                      disabled={deleting === flow.id}
                      title="删除"
                    >
                      {deleting === flow.id ? '…' : '🗑'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FlowListPage;
