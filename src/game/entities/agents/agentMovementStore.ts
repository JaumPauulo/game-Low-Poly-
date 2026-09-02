import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';
import { AGENT_CATALOG } from '../../config/agentCatalog';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';
import {
  AgentMovement,
  createAgentMovement,
  setAgentDestination,
  stepAgentMovement,
} from '../../navigation/movement';
import {
  createNavigationGrid,
  createObstaclesFromConfig,
  isInsideGrid,
  isWalkable,
  worldToGrid,
} from '../../navigation/gridUtils';
import { OccupancyManager } from '../../navigation/occupancy';
import { NavigationGrid, WorldCoordinate2D } from '../../navigation/types';
import { rawAgentStore } from './agentStore';
import { AgentId } from './types';

export interface MovementFeedback {
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: number;
}

export interface AgentMovementStoreState {
  movements: Record<AgentId, AgentMovement>;
  grid: NavigationGrid;
  occupancy: OccupancyManager;
  feedback: MovementFeedback | null;

  // Actions
  commandAgentMove: (agentId: AgentId, targetWorldPos: WorldCoordinate2D) => boolean;
  stopAgent: (agentId: AgentId) => void;
  tick: (delta: number, isPaused: boolean) => void;
  clearFeedback: () => void;
  resetAllMovements: () => void;
}

function initializeState(): {
  grid: NavigationGrid;
  occupancy: OccupancyManager;
  movements: Record<AgentId, AgentMovement>;
} {
  const obstacles = createObstaclesFromConfig(OFFICE_LAYOUT_CONFIG.staticObstacles);
  const grid = createNavigationGrid(
    OFFICE_LAYOUT_CONFIG.grid.cols,
    OFFICE_LAYOUT_CONFIG.grid.rows,
    OFFICE_LAYOUT_CONFIG.grid.cellSize,
    obstacles
  );

  const occupancy = new OccupancyManager();
  const movements = {} as Record<AgentId, AgentMovement>;

  for (const agent of AGENT_CATALOG) {
    movements[agent.id] = createAgentMovement(
      agent.id,
      { x: agent.initialPosition[0], z: agent.initialPosition[2] },
      agent.initialRotationY,
      grid,
      occupancy,
      2.4
    );
  }

  return { grid, occupancy, movements };
}

const initialData = initializeState();

export const rawAgentMovementStore = createStore<AgentMovementStoreState>((set, get) => ({
  movements: initialData.movements,
  grid: initialData.grid,
  occupancy: initialData.occupancy,
  feedback: null,

  commandAgentMove: (agentId: AgentId, targetWorldPos: WorldCoordinate2D): boolean => {
    const { movements, grid, occupancy } = get();
    const movement = movements[agentId];
    if (!movement) return false;

    const targetGrid = worldToGrid(targetWorldPos, grid);

    // 1. Validação do destino no grid
    if (!isInsideGrid(targetGrid, grid)) {
      set({
        feedback: {
          message: 'Destino fora dos limites do escritório.',
          type: 'warning',
          timestamp: Date.now(),
        },
      });
      return false;
    }

    if (!isWalkable(grid, targetGrid)) {
      set({
        feedback: {
          message: 'Local bloqueado por obstáculo ou mobília.',
          type: 'warning',
          timestamp: Date.now(),
        },
      });
      return false;
    }

    // 2. Tenta planejar e iniciar o movimento
    const success = setAgentDestination(movement, targetGrid, grid, occupancy);

    if (!success) {
      set({
        feedback: {
          message: 'Caminho inalcançável para o agente selecionado.',
          type: 'warning',
          timestamp: Date.now(),
        },
      });
      return false;
    }

    // 3. Atualiza a animação visual para walking
    rawAgentStore.getState().setAgentAnimation(agentId, 'walking');

    set({
      feedback: {
        message: `${AGENT_CATALOG.find((a) => a.id === agentId)?.name ?? agentId} a caminho do destino.`,
        type: 'info',
        timestamp: Date.now(),
      },
    });

    return true;
  },

  stopAgent: (agentId: AgentId) => {
    const { movements, occupancy } = get();
    const movement = movements[agentId];
    if (movement && movement.isMoving) {
      movement.isMoving = false;
      movement.status = 'idle';
      movement.path = [];
      movement.targetWorldPos = null;
      occupancy.releaseReservation(agentId);
      rawAgentStore.getState().setAgentAnimation(agentId, 'idle');
    }
  },

  tick: (delta: number, isPaused: boolean) => {
    // Respeita pausa global
    if (isPaused) return;

    // Limita delta para estabilidade numérica caso o frame rate sofra lag pontual
    const safeDelta = Math.min(delta, 0.1);
    const { movements, grid, occupancy } = get();

    let hasAnyFinished = false;

    for (const agentId of Object.keys(movements) as AgentId[]) {
      const movement = movements[agentId];
      if (movement.isMoving) {
        const result = stepAgentMovement(movement, safeDelta, grid, occupancy);

        if (result.hasArrived || result.status === 'blocked') {
          hasAnyFinished = true;
          rawAgentStore.getState().setAgentAnimation(agentId, 'idle');
        }
      }
    }

    // Se algum agente terminou ou bloqueou, notifica subscribers discretamente
    if (hasAnyFinished) {
      set((state) => ({ movements: { ...state.movements } }));
    }
  },

  clearFeedback: () => set({ feedback: null }),

  resetAllMovements: () => {
    const reinitialized = initializeState();
    set({
      grid: reinitialized.grid,
      occupancy: reinitialized.occupancy,
      movements: reinitialized.movements,
      feedback: null,
    });
  },
}));

export function useAgentMovementStore<T>(selector: (state: AgentMovementStoreState) => T): T {
  return useSyncExternalStore(
    rawAgentMovementStore.subscribe,
    () => selector(rawAgentMovementStore.getState()),
    () => selector(rawAgentMovementStore.getState())
  );
}

useAgentMovementStore.getState = rawAgentMovementStore.getState;
useAgentMovementStore.setState = rawAgentMovementStore.setState;
useAgentMovementStore.subscribe = rawAgentMovementStore.subscribe;
