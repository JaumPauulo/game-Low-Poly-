import {
  Activity,
  Battery,
  Brain,
  Camera,
  CheckCircle2,
  Clock,
  Coffee,
  Compass,
  Cpu,
  Eye,
  MapPin,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { useAgentMovementStore } from '../../game/entities/agents/agentMovementStore';
import { useAgentStore } from '../../game/entities/agents/agentStore';
import { useCameraStore } from '../../game/scene/cameraStore';
import { useSimulationStore } from '../../game/simulation/simulationStore';
import { AgentSimulationState } from '../../game/simulation/types';

const ZONE_LABELS: Record<string, string> = {
  workstations: 'Estações de Trabalho',
  coffee: 'Área de Café',
  meeting: 'Sala de Reunião',
  lounge: 'Lounge de Convivência',
  spawn: 'Recepção / Entrada',
  walkable: 'Corredor Central',
};

const STATE_CONFIG: Record<
  AgentSimulationState,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  idle: {
    label: 'Disponível (Idle)',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: User,
  },
  planning: {
    label: 'Planejando Tarefa',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Compass,
  },
  walking: {
    label: 'Caminhando no Escritório',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Activity,
  },
  working: {
    label: 'Em Trabalho Ativo',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Activity,
  },
  thinking: {
    label: 'Refletindo / Analisando',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Brain,
  },
  collaborating: {
    label: 'Em Reunião / Colaborando',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: User,
  },
  coffee: {
    label: 'Pausa para Café (Recarga)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Coffee,
  },
  talking: {
    label: 'Conversando',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: User,
  },
  error: {
    label: 'Erro / Bloqueio',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Activity,
  },
};

export function AgentDetailPanel() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const selectAgent = useAgentStore((state) => state.selectAgent);

  // Dados da simulação
  const simAgent = useSimulationStore((state) =>
    selectedAgentId ? state.state.agents[selectedAgentId] : null
  );
  const simTasks = useSimulationStore((state) => state.state.tasks);

  // Câmera
  const followingAgentId = useCameraStore((state) => state.followingAgentId);
  const followAgent = useCameraStore((state) => state.followAgent);
  const stopFollowing = useCameraStore((state) => state.stopFollowing);

  // Posição de navegação
  const movement = useAgentMovementStore((state) =>
    selectedAgentId ? state.movements[selectedAgentId] : null
  );

  if (!selectedAgentId || !simAgent) {
    return null;
  }

  const catalogAgent = AGENT_CATALOG.find((a) => a.id === selectedAgentId);
  const currentTask = simAgent.currentTaskId ? simTasks[simAgent.currentTaskId] : null;

  const isFollowingThisAgent = followingAgentId === selectedAgentId;

  const handleToggleFollow = () => {
    if (isFollowingThisAgent) {
      stopFollowing();
    } else {
      followAgent(selectedAgentId);
    }
  };

  const handleClose = () => {
    selectAgent(null);
    if (isFollowingThisAgent) {
      stopFollowing();
    }
  };

  const stateConfig = STATE_CONFIG[simAgent.state] || STATE_CONFIG.idle;
  const StateIcon = stateConfig.icon;
  const zoneName = ZONE_LABELS[simAgent.currentZoneId] || simAgent.currentZoneId;

  const energyPercent = Math.round(simAgent.energy * 100);
  const focusPercent = Math.round(simAgent.focus * 100);
  const taskProgressPercent = currentTask ? Math.round(currentTask.progress * 100) : 0;

  const decisionOrigin = simAgent.lastDecisionOrigin === 'ai' ? 'AI' : 'Local';

  return (
    <aside
      id="agent-detail-panel"
      role="complementary"
      aria-label={`Painel de Detalhes do Agente ${simAgent.name}`}
      className="pointer-events-auto w-full md:w-96 max-h-[75vh] md:max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/95 md:bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col transition-all duration-200"
    >
      {/* 1. Cabeçalho com Nome, Função, Indicador e Botão Fechar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0"
            style={{ backgroundColor: catalogAgent?.appearance.primaryColor || '#0284c7' }}
          >
            {simAgent.name.charAt(0)}
          </div>
          <div>
            <h2 id="agent-detail-name" className="text-base font-bold text-slate-800 leading-tight">
              {simAgent.name}
            </h2>
            <p id="agent-detail-role" className="text-xs text-slate-500 font-medium">
              {simAgent.role}
            </p>
          </div>
        </div>

        <button
          id="btn-close-agent-panel"
          type="button"
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 active:bg-slate-300 transition-colors"
          title="Fechar painel (Escape)"
          aria-label="Fechar painel do agente"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* 2. Estado Atual e Zona Atual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Estado Atual */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Estado Atual
            </span>
            <div className="flex items-center gap-1.5">
              <span
                id="agent-state-badge"
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${stateConfig.badgeClass}`}
              >
                <StateIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{stateConfig.label}</span>
              </span>
            </div>
          </div>

          {/* Zona Atual */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Zona Atual
            </span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span id="agent-current-zone" className="truncate" title={zoneName}>
                {zoneName}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Barras Acessíveis de Energia e Foco */}
        <div className="space-y-3 p-3.5 bg-slate-50/60 rounded-xl border border-slate-100">
          {/* Energia */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Battery className="w-4 h-4 text-emerald-600" />
                <span>Energia</span>
              </span>
              <span
                id="agent-energy-label"
                className="font-mono font-bold text-slate-800"
              >
                {energyPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Nível de energia"
              aria-valuenow={energyPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden"
            >
              <div
                id="agent-energy-bar"
                className={`h-full transition-all duration-300 rounded-full ${
                  energyPercent < 20
                    ? 'bg-rose-500'
                    : energyPercent < 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>

          {/* Foco */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>Foco</span>
              </span>
              <span
                id="agent-focus-label"
                className="font-mono font-bold text-slate-800"
              >
                {focusPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Nível de foco"
              aria-valuenow={focusPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden"
            >
              <div
                id="agent-focus-bar"
                className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${focusPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Tarefa Atual e Progresso */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Tarefa em Execução
            </span>
            {currentTask && (
              <span className="text-[11px] font-mono text-slate-500">
                Complexidade: {currentTask.complexity}/5
              </span>
            )}
          </div>

          {currentTask ? (
            <div className="space-y-2">
              <p id="agent-current-task-title" className="font-semibold text-slate-800 text-xs">
                {currentTask.title}
              </p>
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                  <span>Progresso da Tarefa</span>
                  <span id="agent-task-progress-label" className="font-mono font-bold text-slate-800">
                    {taskProgressPercent}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progresso da tarefa atual"
                  aria-valuenow={taskProgressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"
                >
                  <div
                    id="agent-task-progress-bar"
                    className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                    style={{ width: `${taskProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p id="agent-no-task-label" className="text-slate-500 italic text-xs py-1">
              Nenhuma tarefa em andamento.
            </p>
          )}
        </div>

        {/* 5. Tarefas Concluídas e Origem da Decisão */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Tarefas Concluídas */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                Concluídas
              </span>
              <span
                id="agent-completed-tasks-count"
                className="text-base font-extrabold text-emerald-700 font-mono"
              >
                {simAgent.completedTaskCount}
              </span>
            </div>
          </div>

          {/* Origem da Última Decisão (Local vs AI) */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                decisionOrigin === 'AI'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {decisionOrigin === 'AI' ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                Decisão
              </span>
              <span
                id="agent-decision-origin-label"
                className="text-xs font-bold text-slate-800 truncate block"
                title={decisionOrigin === 'AI' ? 'Origem: AI Generativa' : 'Origem: Lógica Local (FSM)'}
              >
                {decisionOrigin === 'AI' ? 'AI' : 'Local (FSM)'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Posição no Grid / Tempo no Estado */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1 font-mono">
            Grid: ({movement?.currentGrid.x ?? 0}, {movement?.currentGrid.z ?? 0})
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Tempo no estado: {Math.round(simAgent.stateElapsedTime)}s</span>
          </span>
        </div>

        {/* 7. Ação para Acompanhar / Cancelar Acompanhamento da Câmera */}
        <div className="pt-2">
          <button
            id="btn-agent-panel-toggle-follow"
            type="button"
            onClick={handleToggleFollow}
            className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-xs transition-all shadow-xs active:scale-[0.98] ${
              isFollowingThisAgent
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            aria-label={
              isFollowingThisAgent
                ? 'Cancelar acompanhamento deste agente pela câmera'
                : 'Acompanhar este agente pela câmera'
            }
          >
            {isFollowingThisAgent ? (
              <>
                <Eye className="w-4 h-4 animate-pulse" />
                <span>Cancelar Acompanhamento (F)</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Acompanhar Agente (F)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
