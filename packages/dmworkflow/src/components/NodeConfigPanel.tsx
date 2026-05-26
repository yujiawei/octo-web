import React, { useState, useCallback, useEffect } from 'react';
import type { Node } from '@xyflow/react';

interface NodeConfigPanelProps {
  node: Node | null;
  onUpdate: (id: string, data: Record<string, any>) => void;
  onClose: () => void;
}

// Key-value pair editor for headers
interface KVPair {
  key: string;
  value: string;
}

const KeyValueEditor: React.FC<{
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  label: string;
}> = ({ pairs, onChange, label }) => {
  const addPair = () => onChange([...pairs, { key: '', value: '' }]);
  const removePair = (index: number) =>
    onChange(pairs.filter((_, i) => i !== index));
  const updatePair = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...pairs];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  return (
    <div className="flow-config__kv">
      <label className="flow-config__label">{label}</label>
      {pairs.map((p, i) => (
        <div key={i} className="flow-config__kv-row">
          <input
            className="flow-config__input flow-config__input--half"
            placeholder="Key"
            value={p.key}
            onChange={(e) => updatePair(i, 'key', e.target.value)}
          />
          <input
            className="flow-config__input flow-config__input--half"
            placeholder="Value"
            value={p.value}
            onChange={(e) => updatePair(i, 'value', e.target.value)}
          />
          <button
            className="flow-config__btn-icon"
            onClick={() => removePair(i)}
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button className="flow-config__btn-sm" onClick={addPair}>
        + Add
      </button>
    </div>
  );
};

// Cron expression human-readable helper
function cronToHuman(expr: string): string {
  if (!expr) return '';
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid expression';
  const [min, hour, dom, mon, dow] = parts;
  if (min === '*' && hour === '*') return 'Every minute';
  if (min === '0' && hour === '*') return 'Every hour';
  if (min === '0' && hour === '0' && dom === '*') return 'Every day at midnight';
  if (dow !== '*') return `Day-of-week ${dow} at ${hour}:${min.padStart(2, '0')}`;
  return `At ${hour}:${min.padStart(2, '0')}`;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onUpdate,
  onClose,
}) => {
  const [localData, setLocalData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setLocalData({ ...(node.data as Record<string, any>) });
    }
  }, [node]);

  const updateField = useCallback(
    (field: string, value: any) => {
      setLocalData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const save = useCallback(() => {
    if (node) {
      onUpdate(node.id, localData);
    }
  }, [node, localData, onUpdate]);

  if (!node) return null;

  const nodeType = (localData.nodeType as string) || node.type || 'script';

  const renderConfig = () => {
    switch (nodeType) {
      case 'script':
        return (
          <>
            <div className="flow-config__field">
              <label className="flow-config__label">Language</label>
              <select
                className="flow-config__select"
                value={localData.language || 'javascript'}
                onChange={(e) => updateField('language', e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="shell">Shell</option>
              </select>
            </div>
            <div className="flow-config__field">
              <label className="flow-config__label">Script</label>
              <textarea
                className="flow-config__textarea flow-config__textarea--code"
                value={localData.code || ''}
                onChange={(e) => updateField('code', e.target.value)}
                rows={10}
                placeholder="// Write your script here..."
                spellCheck={false}
              />
            </div>
            <div className="flow-config__field">
              <label className="flow-config__label">Timeout (seconds)</label>
              <input
                className="flow-config__input"
                type="number"
                min={1}
                max={3600}
                value={localData.timeout || 30}
                onChange={(e) => updateField('timeout', parseInt(e.target.value, 10))}
              />
            </div>
          </>
        );

      case 'http':
        return (
          <>
            <div className="flow-config__field">
              <label className="flow-config__label">Method</label>
              <select
                className="flow-config__select"
                value={localData.method || 'GET'}
                onChange={(e) => updateField('method', e.target.value)}
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flow-config__field">
              <label className="flow-config__label">URL</label>
              <input
                className="flow-config__input"
                type="text"
                value={localData.url || ''}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <KeyValueEditor
              label="Headers"
              pairs={localData.headers_list || []}
              onChange={(pairs) => updateField('headers_list', pairs)}
            />
            <div className="flow-config__field">
              <label className="flow-config__label">Body</label>
              <textarea
                className="flow-config__textarea"
                value={localData.body || ''}
                onChange={(e) => updateField('body', e.target.value)}
                rows={6}
                placeholder='{"key": "value"}'
                spellCheck={false}
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div className="flow-config__field">
              <label className="flow-config__label">Expression</label>
              <input
                className="flow-config__input"
                type="text"
                value={localData.expression || ''}
                onChange={(e) => updateField('expression', e.target.value)}
                placeholder="context.status === 'approved'"
              />
            </div>
            <div className="flow-config__field">
              <label className="flow-config__label">Branches</label>
              {(localData.branches || [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]).map(
                (b: { id: string; label: string }, i: number) => (
                  <div key={b.id} className="flow-config__kv-row">
                    <input
                      className="flow-config__input flow-config__input--half"
                      value={b.label}
                      onChange={(e) => {
                        const branches = [...(localData.branches || [])];
                        branches[i] = { ...branches[i], label: e.target.value };
                        updateField('branches', branches);
                      }}
                    />
                    <button
                      className="flow-config__btn-icon"
                      onClick={() => {
                        const branches = (localData.branches || []).filter(
                          (_: any, idx: number) => idx !== i,
                        );
                        updateField('branches', branches);
                      }}
                      title="Remove branch"
                    >
                      ✕
                    </button>
                  </div>
                ),
              )}
              <button
                className="flow-config__btn-sm"
                onClick={() => {
                  const branches = [
                    ...(localData.branches || []),
                    { id: `branch_${Date.now()}`, label: 'New Branch' },
                  ];
                  updateField('branches', branches);
                }}
              >
                + Add Branch
              </button>
            </div>
          </>
        );

      case 'trigger': {
        const triggerType = localData.triggerType || 'webhook';
        if (triggerType === 'webhook') {
          return (
            <>
              <div className="flow-config__field">
                <label className="flow-config__label">Webhook URL</label>
                <input
                  className="flow-config__input flow-config__input--readonly"
                  type="text"
                  value={localData.webhookUrl || '/v1/flows/:id/webhook'}
                  readOnly
                />
              </div>
              <div className="flow-config__field">
                <label className="flow-config__label">Secret</label>
                <input
                  className="flow-config__input"
                  type="password"
                  value={localData.secret || ''}
                  onChange={(e) => updateField('secret', e.target.value)}
                  placeholder="Webhook signing secret"
                />
              </div>
              <div className="flow-config__field">
                <label className="flow-config__label">Signature Header</label>
                <input
                  className="flow-config__input"
                  type="text"
                  value={localData.signatureHeader || 'X-Signature-256'}
                  onChange={(e) => updateField('signatureHeader', e.target.value)}
                />
              </div>
              <div className="flow-config__field">
                <label className="flow-config__label">Algorithm</label>
                <select
                  className="flow-config__select"
                  value={localData.algorithm || 'sha256'}
                  onChange={(e) => updateField('algorithm', e.target.value)}
                >
                  <option value="sha256">HMAC-SHA256</option>
                  <option value="sha1">HMAC-SHA1</option>
                </select>
              </div>
            </>
          );
        }
        if (triggerType === 'cron') {
          const cronExpr = localData.cronExpression || '';
          return (
            <>
              <div className="flow-config__field">
                <label className="flow-config__label">Cron Expression</label>
                <input
                  className="flow-config__input"
                  type="text"
                  value={cronExpr}
                  onChange={(e) => updateField('cronExpression', e.target.value)}
                  placeholder="0 * * * *"
                />
                {cronExpr && (
                  <span className="flow-config__hint">{cronToHuman(cronExpr)}</span>
                )}
              </div>
            </>
          );
        }
        return <p className="flow-config__hint">Trigger type: {triggerType}</p>;
      }

      default:
        return (
          <div className="flow-config__field">
            <p className="flow-config__hint">
              Configuration for {nodeType} nodes is not yet available.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flow-config-panel">
      <div className="flow-config-panel__header">
        <h3 className="flow-config-panel__title">
          {localData.label || nodeType}
        </h3>
        <button className="flow-config-panel__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="flow-config-panel__body">
        <div className="flow-config__field">
          <label className="flow-config__label">Label</label>
          <input
            className="flow-config__input"
            type="text"
            value={localData.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
            placeholder="Node label"
          />
        </div>

        {renderConfig()}
      </div>

      <div className="flow-config-panel__footer">
        <button className="flow-config__btn flow-config__btn--primary" onClick={save}>
          Apply
        </button>
        <button className="flow-config__btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
