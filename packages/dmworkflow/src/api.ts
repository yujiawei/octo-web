import type { FlowDef, Execution } from './types';

const BASE = '/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }
  // 204 No Content (delete / activate / deactivate) has an empty body —
  // calling res.json() on it throws SyntaxError. Return undefined instead.
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export interface ListResponse<T> {
  items: T[];
  count: number;
}

export const flowApi = {
  // Flow CRUD
  list: (spaceId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (spaceId) params.set('space_id', spaceId);
    if (status) params.set('status', status);
    return request<ListResponse<FlowDef>>(`/flows?${params.toString()}`);
  },

  get: (id: string) => request<FlowDef>(`/flows/${id}`),

  create: (data: {
    space_id: string;
    name: string;
    description?: string;
    definition?: any;
  }) => request<FlowDef>('/flows', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<FlowDef>) =>
    request<FlowDef>(`/flows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/flows/${id}`, { method: 'DELETE' }),

  // Lifecycle
  activate: (id: string) =>
    request<void>(`/flows/${id}/activate`, { method: 'POST' }),

  deactivate: (id: string) =>
    request<void>(`/flows/${id}/deactivate`, { method: 'POST' }),

  // Execution
  execute: (id: string, input?: Record<string, any>) =>
    request<Execution>(`/flows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),

  listExecutions: (flowId: string) =>
    request<ListResponse<Execution>>(`/flows/${flowId}/executions`),

  getExecution: (id: string) =>
    request<Execution>(`/executions/${id}`),

  cancelExecution: (id: string) =>
    request<void>(`/executions/${id}/cancel`, { method: 'POST' }),
};
