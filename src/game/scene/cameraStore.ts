import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';
import {
  clampZoomMultiplier,
  ISOMETRIC_CAMERA_CONFIG,
  normalizeRotationIndex,
} from './cameraUtils';

export interface CameraStoreState {
  rotationIndex: number;
  zoomMultiplier: number;
  target: [number, number, number];

  // Ações puras
  rotateLeft: () => void;
  rotateRight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomMultiplier: (multiplier: number) => void;
  resetCamera: () => void;
}

export const rawCameraStore = createStore<CameraStoreState>((set) => ({
  rotationIndex: 0,
  zoomMultiplier: 1.0,
  target: [...ISOMETRIC_CAMERA_CONFIG.defaultTarget],

  rotateLeft: () =>
    set((state) => ({
      rotationIndex: normalizeRotationIndex(state.rotationIndex - 1),
    })),

  rotateRight: () =>
    set((state) => ({
      rotationIndex: normalizeRotationIndex(state.rotationIndex + 1),
    })),

  zoomIn: () =>
    set((state) => ({
      zoomMultiplier: clampZoomMultiplier(state.zoomMultiplier + 0.15),
    })),

  zoomOut: () =>
    set((state) => ({
      zoomMultiplier: clampZoomMultiplier(state.zoomMultiplier - 0.15),
    })),

  setZoomMultiplier: (multiplier: number) =>
    set(() => ({
      zoomMultiplier: clampZoomMultiplier(multiplier),
    })),

  resetCamera: () =>
    set(() => ({
      rotationIndex: 0,
      zoomMultiplier: 1.0,
      target: [...ISOMETRIC_CAMERA_CONFIG.defaultTarget],
    })),
}));

/**
 * Hook do React para ler fatias específicas do estado da câmera.
 */
export function useCameraStore<T>(selector: (state: CameraStoreState) => T): T {
  return useSyncExternalStore(
    rawCameraStore.subscribe,
    () => selector(rawCameraStore.getState()),
    () => selector(rawCameraStore.getState())
  );
}
