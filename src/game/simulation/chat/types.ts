/**
 * Tipos para o feed de comunicação e chat da equipe do diorama.
 */

import { SimulationEventType } from '../types';

export type MessageKind = 'agent_message' | 'system_event';

export type DialogueContext =
  | 'task_start'
  | 'task_complete'
  | 'task_blocked'
  | 'collaboration_request'
  | 'coffee_return'
  | 'agent_error'
  | 'progress_commentary'
  | 'task_created'
  | 'task_cancelled'
  | 'task_assigned';

export interface TeamMessage {
  id: string;
  kind: MessageKind;
  simulationTime: number;
  timestampFormatted: string; // ex: "01:24"
  agentId?: string;
  agentName?: string;
  agentColor?: string;
  agentRole?: string;
  text: string;
  context: DialogueContext;
  eventType?: SimulationEventType;
  taskId?: string;
  taskTitle?: string;
}

/**
 * Converte segundos de simulação no formato determinístico "mm:ss".
 */
export function formatSimulationTimestamp(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const padMins = mins.toString().padStart(2, '0');
  const padSecs = secs.toString().padStart(2, '0');
  return `${padMins}:${padSecs}`;
}
