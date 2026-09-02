import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';
import { AGENT_CATALOG } from '../../config/agentCatalog';
import { AgentAnimationState, AgentId } from './types';

interface AgentStateRecord {
  animation: AgentAnimationState;
}

export interface AgentStoreState {
  selectedAgentId: AgentId | null;
  agentStates: Record<AgentId, AgentStateRecord>;
  isPaused: boolean;

  // Actions
  selectAgent: (id: AgentId | null) => void;
  setAgentAnimation: (id: AgentId, animation: AgentAnimationState) => void;
  setAllAnimations: (animation: AgentAnimationState) => void;
  togglePause: () => void;
  resetAll: () => void;
}

const initialStates: Record<AgentId, AgentStateRecord> = AGENT_CATALOG.reduce(
  (acc, agent) => {
    acc[agent.id] = { animation: agent.initialAnimation };
    return acc;
  },
  {} as Record<AgentId, AgentStateRecord>
);

export const rawAgentStore = createStore<AgentStoreState>((set) => ({
  selectedAgentId: null,
  agentStates: initialStates,
  isPaused: false,

  selectAgent: (id) => set({ selectedAgentId: id }),

  setAgentAnimation: (id, animation) =>
    set((state) => ({
      agentStates: {
        ...state.agentStates,
        [id]: {
          ...(state.agentStates[id] || {}),
          animation,
        },
      },
    })),

  setAllAnimations: (animation) =>
    set((state) => {
      const updated: Record<AgentId, AgentStateRecord> = {};
      Object.keys(state.agentStates).forEach((key) => {
        updated[key] = { animation };
      });
      return { agentStates: updated };
    }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  resetAll: () =>
    set({
      selectedAgentId: null,
      agentStates: initialStates,
      isPaused: false,
    }),
}));

/**
 * Hook customizado utilizando useSyncExternalStore nativo do React.
 * Elimina totalmente quaisquer descompassos de instâncias internas do React
 * ou problemas de dispatcher nulo ao carregar Zustand com React 19 / bundlers modernos.
 */
export function useAgentStore<T>(selector: (state: AgentStoreState) => T): T {
  return useSyncExternalStore(
    rawAgentStore.subscribe,
    () => selector(rawAgentStore.getState()),
    () => selector(rawAgentStore.getState())
  );
}

// Métodos estáticos de conveniência no useAgentStore
useAgentStore.getState = rawAgentStore.getState;
useAgentStore.setState = rawAgentStore.setState;
useAgentStore.subscribe = rawAgentStore.subscribe;
