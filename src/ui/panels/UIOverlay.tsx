import {
  AlertCircle,
  Box,
  CheckCircle2,
  Maximize2,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Route,
  Sparkles,
  Square,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { useAgentMovementStore } from '../../game/entities/agents/agentMovementStore';
import { useAgentStore } from '../../game/entities/agents/agentStore';
import { AgentAnimationState } from '../../game/entities/agents/types';
import { useCameraStore } from '../../game/scene/cameraStore';
import {
  DEBUG_PRESETS,
  useNavigationDebugStore,
} from '../../game/scene/navigation/navigationDebugStore';

const ANIMATION_OPTIONS: { id: AgentAnimationState; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'walking', label: 'Walking' },
  { id: 'working', label: 'Working' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'talking', label: 'Talking' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'error', label: 'Error' },
];

const CAMERA_ANGLE_LABELS = ['45° SE', '135° SW', '225° NW', '315° NE'] as const;

export function UIOverlay() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const agentStates = useAgentStore((state) => state.agentStates);
  const isPaused = useAgentStore((state) => state.isPaused);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const setAgentAnimation = useAgentStore((state) => state.setAgentAnimation);
  const togglePause = useAgentStore((state) => state.togglePause);

  // Estado da câmera isométrica
  const rotationIndex = useCameraStore((state) => state.rotationIndex);
  const rotateLeft = useCameraStore((state) => state.rotateLeft);
  const rotateRight = useCameraStore((state) => state.rotateRight);
  const zoomIn = useCameraStore((state) => state.zoomIn);
  const zoomOut = useCameraStore((state) => state.zoomOut);
  const resetCamera = useCameraStore((state) => state.resetCamera);

  // Estado do debug de navegação (desativado por padrão)
  const isNavDebugEnabled = useNavigationDebugStore((state) => state.isEnabled);
  const toggleNavDebug = useNavigationDebugStore((state) => state.toggleDebug);
  const activePresetId = useNavigationDebugStore((state) => state.activePresetId);
  const applyPreset = useNavigationDebugStore((state) => state.applyPreset);
  const startCoord = useNavigationDebugStore((state) => state.startCoord);
  const goalCoord = useNavigationDebugStore((state) => state.goalCoord);
  const allowDestObstacle = useNavigationDebugStore((state) => state.allowDestinationObstacle);
  const setAllowDestObstacle = useNavigationDebugStore((state) => state.setAllowDestinationObstacle);

  const selectedAgent = AGENT_CATALOG.find((a) => a.id === selectedAgentId);
  const currentAnimation = selectedAgentId
    ? agentStates[selectedAgentId]?.animation ?? selectedAgent?.initialAnimation
    : undefined;

  // Estado da cinemática e navegação de agentes
  const movements = useAgentMovementStore((state) => state.movements);
  const feedback = useAgentMovementStore((state) => state.feedback);
  const stopAgent = useAgentMovementStore((state) => state.stopAgent);
  const selectedMovement = selectedAgentId ? movements[selectedAgentId] : null;

  return (
    <div
      id="ui-overlay"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-6"
    >
      {/* Barra superior de status e identificação */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 w-full max-w-7xl mx-auto">
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">
              Agent Office Diorama
            </h1>
            <p className="text-xs text-slate-500">4 Agentes Chibi/Minifig • Animações Procedurais</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de alternância do modo de Debug de Navegação */}
          <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1 rounded-xl shadow-xs">
            <button
              id="btn-toggle-nav-debug"
              onClick={toggleNavDebug}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isNavDebugEnabled
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Ativar/desativar visualização do grid de navegação e A*"
              aria-label="Alternar debug de navegação"
            >
              <Route className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Debug Grid</span>
            </button>
          </div>

          {/* Controles de Câmera Isométrica (Rotação 90° e Zoom) */}
          <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1 rounded-xl shadow-xs">
            <button
              id="btn-camera-rotate-left"
              onClick={rotateLeft}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Girar câmera 90° à esquerda"
              aria-label="Girar câmera 90 graus à esquerda"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span
              className="text-[11px] font-mono text-slate-600 px-1 select-none hidden sm:inline"
              title="Ângulo de visão isométrica"
            >
              {CAMERA_ANGLE_LABELS[rotationIndex]}
            </span>

            <button
              id="btn-camera-rotate-right"
              onClick={rotateRight}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Girar câmera 90° à direita"
              aria-label="Girar câmera 90 graus à direita"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3.5 bg-slate-200 mx-0.5" />

            <button
              id="btn-camera-zoom-out"
              onClick={zoomOut}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Reduzir zoom"
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-camera-zoom-in"
              onClick={zoomIn}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-camera-reset"
              onClick={resetCamera}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Restaurar visão original da maquete"
              aria-label="Restaurar câmera original"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Seletor rápido de agentes no topo */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1 rounded-xl shadow-xs">
            {AGENT_CATALOG.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <button
                  key={agent.id}
                  id={`btn-select-${agent.id}`}
                  onClick={() => selectAgent(agent.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: agent.appearance.primaryColor }}
                  />
                  <span className="hidden sm:inline">{agent.name}</span>
                </button>
              );
            })}

            <button
              id="btn-toggle-pause"
              onClick={togglePause}
              className={`p-1.5 rounded-lg border ml-1 transition-colors ${
                isPaused
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={isPaused ? 'Retomar simulação' : 'Pausar simulação'}
              aria-label={isPaused ? 'Retomar animações' : 'Pausar animações'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Banner flutuante de feedback discreto para comandos de navegação */}
      {feedback && (
        <div className="w-full flex justify-center pointer-events-none mb-2">
          <div
            id="nav-feedback-toast"
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium shadow-md border transition-all ${
              feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            ) : feedback.type === 'warning' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Painel inferior: Teste de animações e movimentação do agente selecionado */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-3">
        {selectedAgent && (
          <div className="pointer-events-auto w-full md:w-auto bg-white/95 backdrop-blur-xs border border-slate-200/80 p-3 rounded-xl shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedAgent.appearance.primaryColor }}
                />
                <span className="text-xs font-bold text-slate-800">{selectedAgent.name}</span>
                <span className="text-xs text-slate-500 font-normal">({selectedAgent.role})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Pos: ({selectedMovement?.currentGrid.x ?? 0}, {selectedMovement?.currentGrid.z ?? 0})
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {currentAnimation}
                </span>
              </div>
            </div>

            {/* Status de Navegação e Botão Parar */}
            <div className="flex items-center justify-between gap-2 mb-2 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Navigation className={`w-3.5 h-3.5 ${selectedMovement?.isMoving ? 'text-sky-600 animate-pulse' : 'text-slate-400'}`} />
                {selectedMovement?.isMoving ? (
                  <span>
                    Destino: <strong>({selectedMovement.targetGrid?.x}, {selectedMovement.targetGrid?.z})</strong>
                  </span>
                ) : selectedMovement?.status === 'waiting' ? (
                  <span className="text-amber-700 font-medium">Aguardando passagem livre...</span>
                ) : (
                  <span className="text-slate-500">Clique no piso para mover</span>
                )}
              </div>

              {selectedMovement?.isMoving && (
                <button
                  id="btn-stop-agent-move"
                  onClick={() => stopAgent(selectedAgent.id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-medium transition-colors"
                  title="Interromper movimento"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Parar</span>
                </button>
              )}
            </div>

            {/* Alternador de estados de animação */}
            <div className="flex flex-wrap gap-1.5">
              {ANIMATION_OPTIONS.map((anim) => {
                const isActive = currentAnimation === anim.id;
                return (
                  <button
                    key={anim.id}
                    id={`btn-anim-${anim.id}`}
                    onClick={() => setAgentAnimation(selectedAgent.id, anim.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {anim.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Painel interativo de Depuração de Navegação A* (visível apenas quando o debug está ligado) */}
        {isNavDebugEnabled && (
          <div
            id="nav-debug-panel"
            className="pointer-events-auto bg-white/95 backdrop-blur-xs border border-sky-200 p-3 rounded-xl shadow-md text-xs max-w-md w-full"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Route className="w-4 h-4 text-sky-600" />
                <span>Navegação A* Debug</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  ({startCoord.x}, {startCoord.z})
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                  ({goalCoord.x}, {goalCoord.z})
                </span>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-[11px] text-slate-500 block mb-1">Cenários de Teste:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {DEBUG_PRESETS.map((preset) => {
                  const isPresetActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      id={`btn-preset-${preset.id}`}
                      onClick={() => applyPreset(preset)}
                      className={`px-2 py-1 text-left rounded text-[11px] font-medium transition-colors ${
                        isPresetActive
                          ? 'bg-sky-50 text-sky-700 border border-sky-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={allowDestObstacle}
                onChange={(e) => setAllowDestObstacle(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span>Permitir destino em obstáculo (postos de trabalho)</span>
            </label>
          </div>
        )}

        {/* Rodapé informativo discreto */}
        {!isNavDebugEnabled && (
          <div className="pointer-events-auto hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-white/90 border border-slate-200/80 px-3 py-2 rounded-lg shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Personagens Chibi Procedurais • Primitivas Three.js puras</span>
          </div>
        )}
      </footer>
    </div>
  );
}
