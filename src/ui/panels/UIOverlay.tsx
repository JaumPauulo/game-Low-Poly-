import { useState } from 'react';
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Keyboard,
  ListTodo,
  MessageSquare,
  Route,
  Sparkles,
} from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { useAgentMovementStore } from '../../game/entities/agents/agentMovementStore';
import { useAgentStore } from '../../game/entities/agents/agentStore';
import {
  DEBUG_PRESETS,
  useNavigationDebugStore,
} from '../../game/scene/navigation/navigationDebugStore';
import { useSimulationStore } from '../../game/simulation/simulationStore';
import { AgentDetailPanel } from './AgentDetailPanel';
import { CameraControls } from './CameraControls';
import { EventFeedPanel } from './EventFeedPanel';
import { SimulationControls } from './SimulationControls';
import { TaskBoardPanel } from './TaskBoardPanel';

export function UIOverlay() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const selectAgent = useAgentStore((state) => state.selectAgent);

  // Estados de visibilidade dos painéis no mobile/desktop
  const [showTaskBoard, setShowTaskBoard] = useState(true);
  const [showChatFeed, setShowChatFeed] = useState(true);

  // Contadores para os botões do header
  const tasks = useSimulationStore((s) => s.state.tasks);
  const teamMessages = useSimulationStore((s) => s.teamMessages);
  const taskCount = Object.keys(tasks).length;

  // Estado do debug de navegação (desativado por padrão)
  const isNavDebugEnabled = useNavigationDebugStore((state) => state.isEnabled);
  const toggleNavDebug = useNavigationDebugStore((state) => state.toggleDebug);
  const activePresetId = useNavigationDebugStore((state) => state.activePresetId);
  const applyPreset = useNavigationDebugStore((state) => state.applyPreset);
  const startCoord = useNavigationDebugStore((state) => state.startCoord);
  const goalCoord = useNavigationDebugStore((state) => state.goalCoord);
  const allowDestObstacle = useNavigationDebugStore((state) => state.allowDestinationObstacle);
  const setAllowDestObstacle = useNavigationDebugStore((state) => state.setAllowDestinationObstacle);

  // Estado da cinemática e feedback de navegação
  const feedback = useAgentMovementStore((state) => state.feedback);

  return (
    <div
      id="ui-overlay"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-4 overflow-hidden"
    >
      {/* 1. Barra Superior com Identificação, Controles de Simulação e Câmera */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 w-full max-w-7xl mx-auto">
        {/* Identificação do Projeto */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">
              Agent Office Diorama
            </h1>
            <p className="text-[11px] text-slate-500">4 Agentes • Simulação &amp; Navegação 3D</p>
          </div>
        </div>

        {/* Controles Centrais da Simulação (Pause, 1x, 2x, 4x, Reset, Debug Seed) */}
        <div className="pointer-events-auto">
          <SimulationControls />
        </div>

        {/* Controles de Câmera Isométrica e Atalhos de Painel */}
        <div className="pointer-events-auto flex items-center gap-2">
          <CameraControls />

          {/* Botão de Debug Grid */}
          <button
            id="btn-toggle-nav-debug"
            type="button"
            onClick={toggleNavDebug}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors shadow-xs ${
              isNavDebugEnabled
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white/95 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Alternar modo de inspeção de grid de navegação"
            aria-label="Alternar debug de navegação"
          >
            <Route className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug Grid</span>
          </button>
        </div>
      </header>

      {/* 2. Barra de Agentes e Botões Rápidos de Painéis */}
      <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 pointer-events-none pt-2">
        {/* Seleção rápida de agentes */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1 rounded-xl shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold px-2 hidden sm:inline">
            Agentes:
          </span>
          {AGENT_CATALOG.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            return (
              <button
                key={agent.id}
                id={`btn-select-${agent.id}`}
                type="button"
                onClick={() => selectAgent(isSelected ? null : agent.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={`Selecionar ${agent.name} (${agent.role})`}
                aria-pressed={isSelected}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/50"
                  style={{ backgroundColor: agent.appearance.primaryColor }}
                />
                <span className="inline">{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* Alternância de Painéis (Quadro de Tarefas & Chat da Equipe) */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1 rounded-xl shadow-xs">
          <button
            id="btn-toggle-task-board"
            type="button"
            onClick={() => setShowTaskBoard(!showTaskBoard)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTaskBoard
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Alternar exibição do quadro de tarefas"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tarefas</span>
            <span className="text-[10px] bg-sky-950/40 text-white px-1 rounded font-mono">
              {taskCount}
            </span>
          </button>

          <button
            id="btn-toggle-chat-feed"
            type="button"
            onClick={() => setShowChatFeed(!showChatFeed)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showChatFeed
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Alternar exibição do chat e feed da equipe"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat &amp; Feed</span>
            <span className="text-[10px] bg-sky-950/40 text-white px-1 rounded font-mono">
              {teamMessages.length}
            </span>
          </button>
        </div>

        {/* Guia sutil de atalhos de teclado */}
        <div className="pointer-events-auto hidden xl:flex items-center gap-2 text-[11px] text-slate-500 bg-white/90 backdrop-blur-xs border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-xs">
          <Keyboard className="w-3 h-3 text-slate-400" />
          <span>
            <strong className="text-slate-700">Espaço</strong> pausar •{' '}
            <strong className="text-slate-700">1/2/4</strong> vel. •{' '}
            <strong className="text-slate-700">Q/E</strong> girar 90° •{' '}
            <strong className="text-slate-700">F</strong> seguir •{' '}
            <strong className="text-slate-700">R</strong> recenter •{' '}
            <strong className="text-slate-700">Esc</strong> fechar
          </span>
        </div>
      </div>

      {/* 3. Área Central e Painéis Laterais */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex items-start justify-between pointer-events-none py-3 relative overflow-hidden">
        {/* Painel Esquerdo: Quadro de Tarefas */}
        {showTaskBoard && (
          <div className="pointer-events-auto space-y-2 max-w-xs sm:max-w-sm z-10 transition-all">
            <TaskBoardPanel />
          </div>
        )}

        {/* Painel Direito: Feed de Eventos e Chat (se agente não estiver selecionado ou se selecionado com espaço) */}
        {showChatFeed && !selectedAgentId && (
          <div className="pointer-events-auto space-y-2 max-w-xs sm:max-w-sm ml-auto z-10 transition-all">
            <EventFeedPanel />
          </div>
        )}
      </div>

      {/* 4. Banner de feedback flutuante para comandos de navegação */}
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

      {/* 5. Painel de Detalhes do Agente Selecionado (Desktop Lateral Direita / Mobile Bottom Sheet) */}
      {selectedAgentId && (
        <div className="fixed md:right-5 md:top-24 md:bottom-5 inset-x-0 bottom-0 pointer-events-none flex justify-end z-20">
          <AgentDetailPanel />
        </div>
      )}

      {/* 6. Painel interativo de Depuração A* (quando ativado pelo botão) */}
      {isNavDebugEnabled && (
        <div className="w-full max-w-7xl mx-auto flex justify-start pointer-events-none mb-2">
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
                      type="button"
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
        </div>
      )}

      {/* Dica no rodapé quando nenhum agente está selecionado */}
      {!isNavDebugEnabled && !selectedAgentId && (
        <footer className="w-full max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-white/90 border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Clique em qualquer agente no diorama para inspecionar atributos, energia e foco. Clique no chão para desselecionar.</span>
          </div>
        </footer>
      )}
    </div>
  );
}

