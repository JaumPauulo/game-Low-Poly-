import { useEffect } from 'react';
import { rawAgentStore } from '../game/entities/agents/agentStore';
import { rawCameraStore } from '../game/scene/cameraStore';
import { rawSimulationStore } from '../game/simulation/simulationStore';

export interface KeyEventLike {
  key: string;
  code?: string;
  target?: unknown;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault?: () => void;
}

/**
 * Verifica se um evento do teclado se originou em um campo editável
 * para evitar captura acidental durante digitação.
 */
export function isEditableElement(target: unknown): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }
  const el = target as { tagName?: string; isContentEditable?: boolean };
  if (typeof el.tagName !== 'string') {
    return false;
  }
  const tagName = el.tagName.toUpperCase();
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    Boolean(el.isContentEditable)
  );
}

export interface ShortcutHandlers {
  onEscape?: () => void;
  onTogglePause?: () => void;
  onSetSpeed1x?: () => void;
  onSetSpeed2x?: () => void;
  onSetSpeed4x?: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onToggleFollow?: () => void;
  onRecenter?: () => void;
}

/**
 * Trata um evento de tecla individual e executa a ação correspondente se aplicável.
 */
export function handleGlobalKeyDown(e: KeyEventLike, handlers?: ShortcutHandlers): boolean {
  if (isEditableElement(e.target)) {
    return false;
  }

  // Evita capturar atalhos combinados com Ctrl/Cmd ou Alt (ex: Cmd+R no navegador)
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return false;
  }

  const key = e.key.toLowerCase();

  switch (e.key) {
    case 'Escape': {
      if (handlers?.onEscape) {
        handlers.onEscape();
      } else {
        rawAgentStore.getState().selectAgent(null);
        rawCameraStore.getState().stopFollowing();
      }
      return true;
    }

    case ' ': {
      if (e.preventDefault) {
        e.preventDefault(); // Previne scroll da página ao pressionar barra de espaço
      }
      if (handlers?.onTogglePause) {
        handlers.onTogglePause();
      } else {
        rawSimulationStore.getState().togglePause();
        rawAgentStore.getState().togglePause();
      }
      return true;
    }

    case '1': {
      if (handlers?.onSetSpeed1x) {
        handlers.onSetSpeed1x();
      } else {
        rawSimulationStore.getState().setTimeScale(1);
      }
      return true;
    }

    case '2': {
      if (handlers?.onSetSpeed2x) {
        handlers.onSetSpeed2x();
      } else {
        rawSimulationStore.getState().setTimeScale(2);
      }
      return true;
    }

    case '4': {
      if (handlers?.onSetSpeed4x) {
        handlers.onSetSpeed4x();
      } else {
        rawSimulationStore.getState().setTimeScale(4);
      }
      return true;
    }

    default:
      break;
  }

  switch (key) {
    case 'q': {
      if (handlers?.onRotateLeft) {
        handlers.onRotateLeft();
      } else {
        rawCameraStore.getState().rotateLeft();
      }
      return true;
    }

    case 'e': {
      if (handlers?.onRotateRight) {
        handlers.onRotateRight();
      } else {
        rawCameraStore.getState().rotateRight();
      }
      return true;
    }

    case 'f': {
      if (handlers?.onToggleFollow) {
        handlers.onToggleFollow();
      } else {
        const selectedId = rawAgentStore.getState().selectedAgentId;
        if (selectedId) {
          const currentFollow = rawCameraStore.getState().followingAgentId;
          if (currentFollow === selectedId) {
            rawCameraStore.getState().stopFollowing();
          } else {
            rawCameraStore.getState().followAgent(selectedId);
          }
        }
      }
      return true;
    }

    case 'r': {
      if (handlers?.onRecenter) {
        handlers.onRecenter();
      } else {
        rawCameraStore.getState().resetCamera();
      }
      return true;
    }

    default:
      return false;
  }
}

/**
 * Hook global de atalhos de teclado da simulação e navegação isométrica.
 */
export function useKeyboardShortcuts(customHandlers?: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleGlobalKeyDown(event, customHandlers);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [customHandlers]);
}
