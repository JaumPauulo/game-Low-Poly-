/**
 * Quadro de Tarefas Completo do Escritório (TaskBoardPanel).
 *
 * Suporta:
 * - Listagem rica de tarefas com progresso em tempo real
 * - Filtros combinados por status e por tipo/competência
 * - Busca rápida por título
 * - Ação de criar nova tarefa (com modal de validação estrita)
 * - Edição de tarefas não concluídas
 * - Cancelamento seguro de tarefas (liberando agentes)
 * - Atribuição e desatribuição rápida de agentes
 * - Indicação detalhada de tarefas bloqueadas com dependências pendentes
 */

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Edit2,
  FileSpreadsheet,
  Filter,
  Lock,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { useSimulationStore } from '../../game/simulation/simulationStore';
import { getUnfinishedDependencies } from '../../game/simulation/taskValidation';
import { SkillType, TaskModel, TaskStatus } from '../../game/simulation/types';
import { TaskFormModal } from './TaskFormModal';

export function TaskBoardPanel() {
  const [isExpanded, setIsExpanded] = useState(true);

  // Estados de filtro e busca
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Controle de modal de formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Store
  const tasks = useSimulationStore((s) => s.state.tasks);
  const agents = useSimulationStore((s) => s.state.agents);
  const assignTask = useSimulationStore((s) => s.assignTask);
  const cancelTask = useSimulationStore((s) => s.cancelTask);

  const taskList = useMemo(() => Object.values(tasks), [tasks]);
  const completedCount = taskList.filter((t) => t.status === 'completed').length;

  // Filtragem
  const filteredTasks = useMemo(() => {
    return taskList.filter((task) => {
      // Filtro de status
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      // Filtro de tipo
      if (typeFilter !== 'all' && task.type !== typeFilter) {
        return false;
      }
      // Busca textual
      if (
        searchQuery.trim() &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ) {
        return false;
      }
      return true;
    });
  }, [taskList, statusFilter, typeFilter, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (taskId: string) => {
    const task = tasks[taskId];
    if (task && task.status === 'completed') {
      return;
    }
    setEditingTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleCancelTask = (taskId: string) => {
    const task = tasks[taskId];
    if (!task || task.status === 'completed') return;
    cancelTask(taskId);
  };

  const handleQuickAssign = (taskId: string, agentId: string | null) => {
    assignTask(taskId, agentId);
  };

  const getTypeIcon = (type: SkillType) => {
    switch (type) {
      case 'coding':
        return <Code2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'research':
        return <Search className="w-3.5 h-3.5 text-cyan-400" />;
      case 'analysis':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />;
      case 'planning':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'documentation':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" /> Concluída
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.5 rounded font-medium animate-pulse">
            <Clock className="w-2.5 h-2.5" /> Em Execução
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-sky-300 bg-sky-950/70 border border-sky-800/80 px-1.5 py-0.5 rounded font-medium">
            <UserCheck className="w-2.5 h-2.5" /> Atribuída
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/70 border border-rose-800/80 px-1.5 py-0.5 rounded font-medium">
            <Lock className="w-2.5 h-2.5" /> Bloqueada
          </span>
        );
      case 'backlog':
        return (
          <span className="text-[10px] text-slate-400 bg-slate-800/70 border border-slate-700/80 px-1.5 py-0.5 rounded font-medium">
            A Fazer
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-medium">
            <Ban className="w-2.5 h-2.5" /> Cancelada
          </span>
        );
    }
  };

  return (
    <>
      <div
        id="task-board-panel"
        className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-white text-xs w-80 sm:w-96 transition-all flex flex-col max-h-[calc(100vh-140px)]"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/80 border-b border-slate-800 select-none">
          <div
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="font-semibold text-slate-200 text-xs">Quadro de Tarefas</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-medium">
              {completedCount}/{taskList.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botão de Adicionar Nova Tarefa */}
            <button
              id="btn-add-new-task"
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
              title="Criar nova tarefa no diorama"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova</span>
            </button>

            {/* Recolher / Expandir */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Recolher quadro' : 'Expandir quadro'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Barra de Filtros e Busca */}
            <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 space-y-2">
              {/* Campo de Busca */}
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tarefa por título..."
                  className="w-full pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-sky-400"
                />
              </div>

              {/* Filtro de Status */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                <Filter className="w-3 h-3 text-slate-500 flex-shrink-0" />
                {[
                  { key: 'all', label: 'Todas' },
                  { key: 'backlog', label: 'A Fazer' },
                  { key: 'assigned', label: 'Atribuídas' },
                  { key: 'in_progress', label: 'Em Execução' },
                  { key: 'blocked', label: 'Bloqueadas' },
                  { key: 'completed', label: 'Concluídas' },
                  { key: 'cancelled', label: 'Canceladas' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-colors ${
                      statusFilter === st.key
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Filtro de Tipo */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                {[
                  { key: 'all', label: 'Todos os Tipos' },
                  { key: 'coding', label: 'Coding' },
                  { key: 'research', label: 'Research' },
                  { key: 'analysis', label: 'Analysis' },
                  { key: 'planning', label: 'Planning' },
                  { key: 'documentation', label: 'Docs' },
                ].map((tp) => (
                  <button
                    key={tp.key}
                    type="button"
                    onClick={() => setTypeFilter(tp.key)}
                    className={`px-1.5 py-0.5 rounded font-medium whitespace-nowrap transition-colors ${
                      typeFilter === tp.key
                        ? 'bg-slate-200 text-slate-900 font-semibold'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Tarefas */}
            <div className="overflow-y-auto p-2.5 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-500 italic text-[11px]">
                  Nenhuma tarefa encontrada com os filtros selecionados.
                </div>
              ) : (
                filteredTasks.map((task: TaskModel) => {
                  const assignedAgent = task.assignedAgentId ? agents[task.assignedAgentId] : null;
                  const progressPercent = Math.min(100, Math.round(task.progress * 100));
                  const unfinishedDeps = getUnfinishedDependencies(task, tasks);
                  const isBlocked = task.status === 'blocked';
                  const isCompleted = task.status === 'completed';
                  const isCancelled = task.status === 'cancelled';

                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                          : isCancelled
                          ? 'bg-slate-950/30 border-slate-800/40 opacity-50'
                          : isBlocked
                          ? 'bg-slate-950/80 border-rose-900/50'
                          : task.status === 'in_progress'
                          ? 'bg-slate-950/90 border-amber-800/60 shadow-xs'
                          : 'bg-slate-950/70 border-slate-800/70'
                      }`}
                    >
                      {/* Topo do Card: Ícone, Título e Badges */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {getTypeIcon(task.type)}
                          <span
                            className="font-semibold text-[11px] text-slate-200 truncate"
                            title={task.title}
                          >
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span
                            className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-amber-300"
                            title={`Prioridade ${task.priority}/5`}
                          >
                            P{task.priority}
                          </span>
                          <span
                            className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-indigo-300"
                            title={`Complexidade ${task.complexity}/5`}
                          >
                            C{task.complexity}
                          </span>
                          {getStatusBadge(task.status)}
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : task.status === 'in_progress'
                              ? 'bg-amber-400'
                              : isBlocked
                              ? 'bg-rose-500/50'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Informações detalhadas de bloqueio */}
                      {isBlocked && unfinishedDeps.length > 0 && (
                        <div className="mb-2 p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/50 flex items-start gap-1.5 text-[10px] text-rose-300">
                          <AlertCircle className="w-3 h-3 flex-shrink-0 text-rose-400 mt-0.5" />
                          <div>
                            <span className="font-semibold text-rose-200">Aguardando dependências:</span>{' '}
                            {unfinishedDeps.map((d) => d.title).join(' • ')}
                          </div>
                        </div>
                      )}

                      {/* Linha de Rodapé do Card: Agente e Ações */}
                      <div className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-slate-900">
                        {/* Seletor rápido de atribuição */}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-slate-500">Resp:</span>
                          {!isCompleted && !isCancelled ? (
                            <select
                              value={task.assignedAgentId || ''}
                              onChange={(e) => handleQuickAssign(task.id, e.target.value || null)}
                              className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-hidden focus:border-sky-400"
                            >
                              <option value="">(Nenhum)</option>
                              {AGENT_CATALOG.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                  {agent.name}
                                </option>
                              ))}
                            </select>
                          ) : assignedAgent ? (
                            <span className="font-medium text-slate-300">{assignedAgent.name}</span>
                          ) : (
                            <span className="text-slate-500 italic">Nenhum</span>
                          )}

                          {assignedAgent && !isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleQuickAssign(task.id, null)}
                              className="text-slate-400 hover:text-rose-400 p-0.5 rounded"
                              title="Remover atribuição"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Botões de Ação: Editar e Cancelar */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-mono text-slate-400 mr-1">{progressPercent}%</span>

                          {/* Botão de Editar */}
                          <button
                            type="button"
                            disabled={isCompleted}
                            onClick={() => handleOpenEditModal(task.id)}
                            className={`p-1 rounded transition-colors ${
                              isCompleted
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
                            }`}
                            title={
                              isCompleted
                                ? 'Tarefas concluídas não podem ser editadas'
                                : 'Editar tarefa'
                            }
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Botão de Cancelar */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelTask(task.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Cancelar tarefa e liberar agente"
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Criação / Edição de Tarefas */}
      <TaskFormModal
        isOpen={isModalOpen}
        taskIdToEdit={editingTaskId}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTaskId(null);
        }}
      />
    </>
  );
}
