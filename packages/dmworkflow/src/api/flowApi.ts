// Shim: re-export individual functions from the flowApi namespace
import { flowApi } from '../api';
import type { FlowDef, FlowStatus as FlowStatusType } from '../types';

// Re-export types with the names the pages expect
export type Flow = FlowDef;
export type { FlowStatusType as FlowStatus };

export const listFlows = flowApi.list;
export const getFlow = flowApi.get;
export const createFlow = flowApi.create;
export const updateFlow = flowApi.update;
export const deleteFlow = flowApi.delete;
export const activateFlow = flowApi.activate;
export const deactivateFlow = flowApi.deactivate;
export const executeFlow = flowApi.execute;
export const listExecutions = flowApi.listExecutions;
export const getExecution = flowApi.getExecution;
export const cancelExecution = flowApi.cancelExecution;
