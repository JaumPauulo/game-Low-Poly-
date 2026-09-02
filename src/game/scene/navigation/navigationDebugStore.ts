import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';
import { GridCoordinate } from '../../navigation/types';

export interface NavigationDebugPreset {
  id: string;
  label: string;
  start: GridCoordinate;
  goal: GridCoordinate;
}

export const DEBUG_PRESETS: NavigationDebugPreset[] = [
  { id: 'corridor', label: 'Corredor Reto', start: { x: 1, z: 4 }, goal: { x: 11, z: 4 } },
  { id: 'around-desks', label: 'Desvio de Mesas', start: { x: 1, z: 4 }, goal: { x: 5, z: 1 } },
  { id: 'coffee-to-meeting', label: 'Café → Reunião', start: { x: 2, z: 6 }, goal: { x: 10, z: 2 } },
  { id: 'lounge-to-work', label: 'Lounge → Posto 1', start: { x: 9, z: 6 }, goal: { x: 2, z: 4 } },
];

export interface NavigationDebugState {
  isEnabled: boolean;
  startCoord: GridCoordinate;
  goalCoord: GridCoordinate;
  allowDestinationObstacle: boolean;
  activePresetId: string;
}

export interface NavigationDebugActions {
  toggleDebug: () => void;
  setStartCoord: (coord: GridCoordinate) => void;
  setGoalCoord: (coord: GridCoordinate) => void;
  applyPreset: (preset: NavigationDebugPreset) => void;
  setAllowDestinationObstacle: (allow: boolean) => void;
}

export type NavigationDebugStore = NavigationDebugState & NavigationDebugActions;

export const rawNavigationDebugStore = createStore<NavigationDebugStore>((set) => ({
  isEnabled: false, // Desativado por padrão conforme especificação
  startCoord: { x: 1, z: 4 },
  goalCoord: { x: 11, z: 4 },
  allowDestinationObstacle: false,
  activePresetId: 'corridor',

  toggleDebug: () => set((state) => ({ isEnabled: !state.isEnabled })),

  setStartCoord: (coord) => set({ startCoord: coord, activePresetId: 'custom' }),

  setGoalCoord: (coord) => set({ goalCoord: coord, activePresetId: 'custom' }),

  applyPreset: (preset) =>
    set({
      startCoord: preset.start,
      goalCoord: preset.goal,
      activePresetId: preset.id,
    }),

  setAllowDestinationObstacle: (allow) => set({ allowDestinationObstacle: allow }),
}));

export function useNavigationDebugStore<T>(selector: (state: NavigationDebugStore) => T): T {
  return useSyncExternalStore(
    rawNavigationDebugStore.subscribe,
    () => selector(rawNavigationDebugStore.getState()),
    () => selector(rawNavigationDebugStore.getState())
  );
}
