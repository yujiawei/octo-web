// Shim: re-export individual functions from the flowApi namespace
// Adapts the namespace-style API to the individual-function style the pages expect
import { flowApi } from '../api';
import type { FlowDef, FlowStatus as FlowStatusType } from '../types';

// Re-export types with the names the pages expect
export type Flow = FlowDef;
export type { FlowStatusType as FlowStatus };

// listFlows: unwrap {items, count} → items array (pages expect flat array)
export const listFlows = async (spaceId?: string, status?: string): Promise<FlowDef[]> => {
  const resp = await flowApi.list(spaceId, status);
  return resp.items;
};

export const getFlow = flowApi.get;
export const createFlow = flowApi.create;
export const updateFlow = flowApi.update;
export const deleteFlow = flowApi.delete;
export const activateFlow = flowApi.activate;
export const deactivateFlow = flowApi.deactivate;
export const executeFlow = flowApi.execute;

// listExecutions: also unwrap
export const listExecutions = async (flowId: string) => {
  const resp = await flowApi.listExecutions(flowId);
  return resp.items;
};

export const getExecution = flowApi.getExecution;
export const cancelExecution = flowApi.cancelExecution;
