import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flowApi } from '../api';
import type { FlowDef, Definition, Execution } from '../types';
import FlowEditor from '../components/FlowEditor';
import FlowToolbar from '../components/FlowToolbar';
import ExecutionView from '../components/ExecutionView';

interface FlowEditorPageProps {
  flowId: string;
  onBack: () => void;
}

type ViewMode = 'editor' | 'history' | 'execution';

const FlowEditorPage: React.FC<FlowEditorPageProps> = ({ flowId, onBack }) => {
  const [flow, setFlow] = useState<FlowDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const currentDef = useRef<Definition | null>(null);

  // Load flow data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await flowApi.get(flowId);
        if (!cancelled) {
          setFlow(data);
          currentDef.current = data.definition;
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [flowId]);

  // Track definition changes from editor
  const onDefinitionChange = useCallback((def: Definition) => {
    currentDef.current = def;
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    if (!flow || !currentDef.current) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await flowApi.update(flow.id, {
        definition: currentDef.current,
        name: flow.name,
        description: flow.description,
      } as any);
      setFlow(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [flow]);

  // Name change
  const handleNameChange = useCallback(
    (name: string) => {
      if (flow) setFlow({ ...flow, name });
    },
    [flow],
  );

  // Activate / Deactivate
  const handleActivate = useCallback(async () => {
    if (!flow) return;
    try {
      await flowApi.activate(flow.id);
      setFlow({ ...flow, status: 'active' });
    } catch (err: any) {
      setError(err.message);
    }
  }, [flow]);

  const handleDeactivate = useCallback(async () => {
    if (!flow) return;
    try {
      await flowApi.deactivate(flow.id);
      setFlow({ ...flow, status: 'draft' });
    } catch (err: any) {
      setError(err.message);
    }
  }, [flow]);

  // Manual run
  const handleRun = useCallback(async () => {
    if (!flow) return;
    try {
      const exec = await flowApi.execute(flow.id);
      setSelectedExecution(exec);
      setViewMode('execution');
    } catch (err: any) {
      setError(err.message);
    }
  }, [flow]);

  // Execution history
  const handleHistory = useCallback(async () => {
    if (!flow) return;
    try {
      const res = await flowApi.listExecutions(flow.id);
      setExecutions(res.items || []);
      setViewMode('history');
    } catch (err: any) {
      setError(err.message);
    }
  }, [flow]);

  const handleViewExecution = useCallback(async (execId: string) => {
    try {
      const exec = await flowApi.getExecution(execId);
      setSelectedExecution(exec);
      setViewMode('execution');
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  if (loading) {
    return <div className="flow-editor-page flow-editor-page--loading">加载中…</div>;
  }

  if (!flow) {
    return (
      <div className="flow-editor-page flow-editor-page--error">
        <p>Flow not found</p>
        <button onClick={onBack}>← 返回列表</button>
      </div>
    );
  }

  return (
    <div className="flow-editor-page">
      {error && (
        <div className="flow-editor-page__error">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="flow-editor-page__nav">
        <button className="flow-editor-page__back" onClick={onBack}>
          ← 返回
        </button>
        {viewMode !== 'editor' && (
          <button
            className="flow-editor-page__nav-btn"
            onClick={() => setViewMode('editor')}
          >
            编辑器
          </button>
        )}
      </div>

      <FlowToolbar
        name={flow.name}
        status={flow.status}
        saving={saving}
        onNameChange={handleNameChange}
        onSave={handleSave}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onRun={handleRun}
        onHistory={handleHistory}
      />

      {viewMode === 'editor' && (
        <FlowEditor
          initialDefinition={flow.definition}
          onDefinitionChange={onDefinitionChange}
          className="flow-editor-page__editor"
        />
      )}

      {viewMode === 'history' && (
        <div className="flow-editor-page__history">
          <h3>执行历史</h3>
          {executions.length === 0 ? (
            <p>暂无执行记录</p>
          ) : (
            <table className="flow-list-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>状态</th>
                  <th>开始时间</th>
                  <th>结束时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec) => (
                  <tr key={exec.id}>
                    <td className="flow-list-table__mono">{exec.id.slice(0, 8)}…</td>
                    <td>
                      <span className={`flow-badge flow-badge--${exec.status}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td>{exec.started_at || '-'}</td>
                    <td>{exec.finished_at || '-'}</td>
                    <td>
                      <button onClick={() => handleViewExecution(exec.id)}>
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewMode === 'execution' && selectedExecution && (
        <ExecutionView execution={selectedExecution} definition={flow.definition} />
      )}
    </div>
  );
};

export default FlowEditorPage;
