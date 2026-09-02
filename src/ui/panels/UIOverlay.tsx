import { Box, Layers, Pause, Play, Sparkles } from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { useAgentStore } from '../../game/entities/agents/agentStore';
import { AgentAnimationState } from '../../game/entities/agents/types';

const ANIMATION_OPTIONS: { id: AgentAnimationState; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'walking', label: 'Walking' },
  { id: 'working', label: 'Working' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'talking', label: 'Talking' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'error', label: 'Error' },
];

export function UIOverlay() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const agentStates = useAgentStore((state) => state.agentStates);
  const isPaused = useAgentStore((state) => state.isPaused);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const setAgentAnimation = useAgentStore((state) => state.setAgentAnimation);
  const togglePause = useAgentStore((state) => state.togglePause);

  const selectedAgent = AGENT_CATALOG.find((a) => a.id === selectedAgentId);
  const currentAnimation = selectedAgentId
    ? agentStates[selectedAgentId]?.animation ?? selectedAgent?.initialAnimation
    : undefined;

  return (
    <div
      id="ui-overlay"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-6"
    >
      {/* Barra superior de status e identificação */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto">
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
      </header>

      {/* Painel inferior: Teste de animações do agente selecionado */}
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
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Estado: {currentAnimation}
              </span>
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

        {/* Rodapé informativo discreto */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-white/90 border border-slate-200/80 px-3 py-2 rounded-lg shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Personagens Chibi Procedurais • Primitivas Three.js puras</span>
        </div>
      </footer>
    </div>
  );
}
