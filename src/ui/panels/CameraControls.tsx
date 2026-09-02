import {
  Camera,
  Eye,
  Maximize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAgentStore } from '../../game/entities/agents/agentStore';
import { useCameraStore } from '../../game/scene/cameraStore';

const CAMERA_ANGLE_LABELS = ['45° SE', '135° SW', '225° NW', '315° NE'] as const;

export function CameraControls() {
  const rotationIndex = useCameraStore((state) => state.rotationIndex);
  const zoomMultiplier = useCameraStore((state) => state.zoomMultiplier);
  const followingAgentId = useCameraStore((state) => state.followingAgentId);
  const rotateLeft = useCameraStore((state) => state.rotateLeft);
  const rotateRight = useCameraStore((state) => state.rotateRight);
  const zoomIn = useCameraStore((state) => state.zoomIn);
  const zoomOut = useCameraStore((state) => state.zoomOut);
  const resetCamera = useCameraStore((state) => state.resetCamera);
  const followAgent = useCameraStore((state) => state.followAgent);
  const stopFollowing = useCameraStore((state) => state.stopFollowing);

  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);

  const isFollowingSelected = Boolean(
    selectedAgentId && followingAgentId === selectedAgentId
  );

  const handleToggleFollow = () => {
    if (!selectedAgentId) return;
    if (isFollowingSelected) {
      stopFollowing();
    } else {
      followAgent(selectedAgentId);
    }
  };

  return (
    <div
      id="camera-controls"
      role="toolbar"
      aria-label="Controles de Câmera Isométrica"
      className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-200/90 p-1 rounded-xl shadow-xs"
    >
      {/* Rotacionar 90° à esquerda */}
      <button
        id="btn-camera-rotate-left"
        type="button"
        onClick={rotateLeft}
        className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 min-w-[36px] min-h-[36px] rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 transition-colors"
        title="Girar 90° para esquerda (Q)"
        aria-label="Girar 90 graus para esquerda"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Indicador de ângulo estritamente isométrico */}
      <span
        id="camera-angle-indicator"
        className="text-[11px] font-mono font-medium text-slate-600 px-1.5 py-0.5 rounded bg-slate-100/80 select-none hidden sm:inline"
        title={`Ângulo isométrico ${CAMERA_ANGLE_LABELS[rotationIndex]} (Zoom: ${Math.round(zoomMultiplier * 100)}%)`}
      >
        {CAMERA_ANGLE_LABELS[rotationIndex]}
      </span>

      {/* Rotacionar 90° à direita */}
      <button
        id="btn-camera-rotate-right"
        type="button"
        onClick={rotateRight}
        className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 min-w-[36px] min-h-[36px] rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 transition-colors"
        title="Girar 90° para direita (E)"
        aria-label="Girar 90 graus para direita"
      >
        <RotateCw className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-200 mx-0.5" />

      {/* Reduzir zoom */}
      <button
        id="btn-camera-zoom-out"
        type="button"
        onClick={zoomOut}
        className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 min-w-[36px] min-h-[36px] rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 transition-colors"
        title="Reduzir zoom"
        aria-label="Reduzir zoom"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Aumentar zoom */}
      <button
        id="btn-camera-zoom-in"
        type="button"
        onClick={zoomIn}
        className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 min-w-[36px] min-h-[36px] rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 transition-colors"
        title="Aumentar zoom"
        aria-label="Aumentar zoom"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Recenter diorama */}
      <button
        id="btn-camera-recenter"
        type="button"
        onClick={resetCamera}
        className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 min-w-[36px] min-h-[36px] rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 transition-colors"
        title="Recentralizar diorama (R)"
        aria-label="Recentralizar câmera no centro do escritório"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-200 mx-0.5" />

      {/* Acompanhar agente selecionado */}
      <button
        id="btn-camera-follow-agent"
        type="button"
        disabled={!selectedAgentId}
        onClick={handleToggleFollow}
        className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all ${
          !selectedAgentId
            ? 'opacity-40 cursor-not-allowed text-slate-400'
            : isFollowingSelected
            ? 'bg-sky-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        title={
          !selectedAgentId
            ? 'Selecione um agente para acompanhar (F)'
            : isFollowingSelected
            ? 'Cancelar acompanhamento do agente (F)'
            : 'Acompanhar agente selecionado (F)'
        }
        aria-label={
          isFollowingSelected
            ? 'Cancelar acompanhamento da câmera'
            : 'Acompanhar agente com a câmera'
        }
        aria-pressed={isFollowingSelected}
      >
        {isFollowingSelected ? (
          <>
            <Eye className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="hidden sm:inline">Acompanhando</span>
          </>
        ) : (
          <>
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Acompanhar (F)</span>
          </>
        )}
      </button>
    </div>
  );
}
