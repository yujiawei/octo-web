import { WKApp } from '@octo/base';
import type { FlowDef, Execution } from './types';

const BASE = '/v1';

/**
 * Inject the same auth headers the rest of the app uses.
 *
 * Background: this module talks to the backend with native `fetch`, so
 * `APIClient`'s axios interceptors (which inject `token` and
 * `X-Space-Id` for every request the rest of the app makes) do NOT
 * run. Without this the Flow list/CRUD endpoints come back as
 *   401 {"msg":"token不能为空，请先登录！"}
 *
 * We deliberately read through the documented extension points
 * `APIClient.shared.config.tokenCallback` / `spaceIdCallback` rather
 * than reaching into `WKApp.loginInfo.token` directly, so that this
 * file stays aligned with the *one* place auth-header computation is
 * declared (`apps/web/src/index.tsx`). When that wiring changes, Flow
 * picks it up for free.
 */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = WKApp.apiClient.config.tokenCallback?.();
  if (token && token !== '') {
    headers['token'] = token;
  }
  const spaceId = WKApp.apiClient.config.spaceIdCallback?.();
  if (spaceId && spaceId !== '') {
    headers['X-Space-Id'] = spaceId;
  }
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // 401 means our session is no longer valid. The rest of the app
    // funnels 401s through APIClient's response interceptor, which
    // calls `logoutCallback` (BaseModule wires it to WKApp.shared.logout).
    // We're outside that pipeline, so trigger the same logout path
    // explicitly — otherwise the user stays on a broken Flow page.
    if (res.status === 401) {
      WKApp.apiClient.logoutCallback?.();
    }
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
