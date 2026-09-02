/**
 * Modal de Criação e Edição de Tarefas com Validações Rígidas:
 * - Título obrigatório (não vazio)
 * - Prioridade de 1 a 5
 * - Complexidade de 1 a 5
 * - Detecção de dependência circular em tempo real
 * - Impedir auto-dependência
 * - Impedir edição de tarefas já concluídas
 * - Validação de agente existente
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Code2,
  FileSpreadsheet,
  Lock,
  PlusCircle,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { useSimulationStore } from '../../game/simulation/simulationStore';
import {
  detectCircularDependency,
  TaskInputData,
  validateTaskInput,
} from '../../game/simulation/taskValidation';
import { SkillType, TaskModel } from '../../game/simulation/types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskIdToEdit?: string | null;
}

const TASK_TYPE_OPTIONS: { type: SkillType; label: string; icon: React.ReactNode }[] = [
  { type: 'coding', label: 'Coding (Programação)', icon: <Code2 className="w-3.5 h-3.5 text-emerald-500" /> },
  { type: 'research', label: 'Research (Pesquisa)', icon: <Search className="w-3.5 h-3.5 text-cyan-500" /> },
  { type: 'analysis', label: 'Analysis (Análise de Dados)', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" /> },
  { type: 'planning', label: 'Planning (Planejamento & UX)', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> },
  { type: 'documentation', label: 'Documentation (Documentação)', icon: <BookOpen className="w-3.5 h-3.5 text-purple-500" /> },
];

export function TaskFormModal({ isOpen, onClose, taskIdToEdit }: TaskFormModalProps) {
  const allTasks = useSimulationStore((s) => s.state.tasks);
  const createTask = useSimulationStore((s) => s.createTask);
  const updateTask = useSimulationStore((s) => s.updateTask);

  const isEditing = Boolean(taskIdToEdit && allTasks[taskIdToEdit]);
  const existingTask: TaskModel | undefined = taskIdToEdit ? allTasks[taskIdToEdit] : undefined;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<SkillType>('coding');
  const [priority, setPriority] = useState<number>(3);
  const [complexity, setComplexity] = useState<number>(3);
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Inicializa os campos quando abrir em modo edição ou criação
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setGlobalError(null);

      if (isEditing && existingTask) {
        setTitle(existingTask.title);
        setType(existingTask.type);
        setPriority(existingTask.priority);
        setComplexity(existingTask.complexity);
        setAssignedAgentId(existingTask.assignedAgentId || '');
        setDependencies(existingTask.dependencies || []);
      } else {
        // Novo item
        setTitle('');
        setType('coding');
        setPriority(3);
        setComplexity(3);
        setAssignedAgentId('');
        setDependencies([]);
      }
    }
  }, [isOpen, isEditing, existingTask]);

  if (!isOpen) return null;

  const validAgentIds = AGENT_CATALOG.map((a) => a.id);
  const isCompleted = existingTask?.status === 'completed';

  // Toggle de seleção de dependência com checagem imediata de ciclo
  const handleToggleDependency = (depId: string) => {
    if (isCompleted) return;

    if (dependencies.includes(depId)) {
      setDependencies(dependencies.filter((id) => id !== depId));
      // Remove erro de dependência se houver
      setErrors((prev) => {
        const next = { ...prev };
        delete next.dependencies;
        return next;
      });
    } else {
      const nextDeps = [...dependencies, depId];
      if (taskIdToEdit) {
        const cycleCheck = detectCircularDependency(taskIdToEdit, nextDeps, allTasks);
        if (cycleCheck.hasCycle) {
          setErrors((prev) => ({
            ...prev,
            dependencies: `Atenção: Adicionar esta dependência gera um ciclo (${cycleCheck.cyclePath?.join(' → ')})`,
          }));
          return;
        }
      }
      setDependencies(nextDeps);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.dependencies;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCompleted) {
      setGlobalError('Tarefas já concluídas não podem ser alteradas.');
      return;
    }

    const payload: TaskInputData = {
      title: title.trim(),
      type,
      priority,
      complexity,
      assignedAgentId: assignedAgentId ? assignedAgentId : null,
      dependencies,
    };

    const validation = validateTaskInput(payload, {
      taskId: taskIdToEdit ?? undefined,
      allTasks,
      validAgentIds,
    });

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      if (validation.errors.general) {
        setGlobalError(validation.errors.general);
      }
      return;
    }

    if (isEditing && taskIdToEdit) {
      const res = updateTask(taskIdToEdit, payload);
      if (!res.success) {
        setErrors(res.errors || {});
        if (res.errors?.general) setGlobalError(res.errors.general);
        return;
      }
    } else {
      const res = createTask(payload);
      if (!res.success) {
        setErrors(res.errors || {});
        if (res.errors?.general) setGlobalError(res.errors.general);
        return;
      }
    }

    onClose();
  };

  // Outras tarefas disponíveis para serem dependências (exceto ela própria)
  const candidateDependencies = Object.values(allTasks).filter(
    (t) => !taskIdToEdit || t.id !== taskIdToEdit
  );

  return (
    <div
      id="task-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="task-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden text-slate-800 transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Save className="w-5 h-5 text-indigo-600" />
            ) : (
              <PlusCircle className="w-5 h-5 text-sky-600" />
            )}
            <div>
              <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                {isEditing ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditing
                  ? `ID: ${taskIdToEdit} • Atualize atributos e dependências`
                  : 'Adicione uma tarefa com tipo, prioridade e dependências ao diorama'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-task-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Fechar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerta de tarefa concluída (se aplicável) */}
        {isCompleted && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Tarefa Concluída:</strong> Esta tarefa já foi finalizada na simulação e não pode mais ser modificada.
            </div>
          </div>
        )}

        {/* Alerta de erro geral */}
        {globalError && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Título */}
          <div>
            <label htmlFor="task-title-input" className="block font-semibold text-slate-700 mb-1">
              Título da Tarefa <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              disabled={isCompleted}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n.title;
                    return n;
                  });
                }
              }}
              placeholder="Ex: Otimizar rotas de navegação A*"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 transition-all ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-300'
                  : 'border-slate-300 focus:ring-sky-400 focus:border-sky-500'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            />
            {errors.title && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* 2. Tipo da Tarefa */}
          <div>
            <label htmlFor="task-type-select" className="block font-semibold text-slate-700 mb-1">
              Tipo / Competência Exigida <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TASK_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  disabled={isCompleted}
                  onClick={() => setType(opt.type)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all ${
                    type === opt.type
                      ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {opt.icon}
                  <span className="text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.type}
              </p>
            )}
          </div>

          {/* 3. Prioridade (1 a 5) e Complexidade (1 a 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Prioridade */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Prioridade (1 = Baixa, 5 = Urgente) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={isCompleted}
                    onClick={() => setPriority(lvl)}
                    className={`flex-1 py-1.5 rounded-lg border text-center font-mono text-xs transition-all ${
                      priority === lvl
                        ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    P{lvl}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {priority === 1 && 'Prioridade Baixa'}
                {priority === 2 && 'Prioridade Moderada'}
                {priority === 3 && 'Prioridade Padrão'}
                {priority === 4 && 'Prioridade Alta'}
                {priority === 5 && 'Prioridade Máxima / Urgente'}
              </span>
              {errors.priority && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.priority}
                </p>
              )}
            </div>

            {/* Complexidade */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Complexidade (1 = Trivial, 5 = Crítica) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={isCompleted}
                    onClick={() => setComplexity(lvl)}
                    className={`flex-1 py-1.5 rounded-lg border text-center font-mono text-xs transition-all ${
                      complexity === lvl
                        ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    C{lvl}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {complexity === 1 && 'Trivial (rápida execução)'}
                {complexity === 2 && 'Simples'}
                {complexity === 3 && 'Média complexidade'}
                {complexity === 4 && 'Alta complexidade'}
                {complexity === 5 && 'Crítica (demanda alto foco)'}
              </span>
              {errors.complexity && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.complexity}
                </p>
              )}
            </div>
          </div>

          {/* 4. Atribuir Agente (Opcional) */}
          <div className="pt-1">
            <label htmlFor="task-agent-select" className="block font-semibold text-slate-700 mb-1">
              Atribuir Agente Responsável (Opcional)
            </label>
            <select
              id="task-agent-select"
              value={assignedAgentId}
              disabled={isCompleted}
              onChange={(e) => {
                setAssignedAgentId(e.target.value);
                if (errors.assignedAgentId) {
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n.assignedAgentId;
                    return n;
                  });
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-sky-400 focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Nenhum agente atribuído (Disponível no Backlog)</option>
              {AGENT_CATALOG.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} — {agent.role}
                </option>
              ))}
            </select>
            {errors.assignedAgentId && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.assignedAgentId}
              </p>
            )}
          </div>

          {/* 5. Dependências Válidas & Detecção de Ciclo */}
          <div className="pt-1">
            <label className="block font-semibold text-slate-700 mb-1">
              Dependências da Tarefa
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Selecione tarefas que devem ser 100% concluídas antes desta ser iniciada:
            </p>

            {candidateDependencies.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-lg">
                Nenhuma outra tarefa disponível para criar dependências.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {candidateDependencies.map((cand) => {
                  const isChecked = dependencies.includes(cand.id);
                  // Verifica se marcar criaria dependência circular
                  let wouldCauseCycle = false;
                  if (taskIdToEdit && !isChecked) {
                    const cycleCheck = detectCircularDependency(
                      taskIdToEdit,
                      [...dependencies, cand.id],
                      allTasks
                    );
                    wouldCauseCycle = cycleCheck.hasCycle;
                  }

                  return (
                    <label
                      key={cand.id}
                      className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-sky-50 border-sky-300 text-sky-900 font-medium'
                          : wouldCauseCycle
                          ? 'bg-rose-50/60 border-rose-200 text-rose-800 opacity-70 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCompleted || (wouldCauseCycle && !isChecked)}
                          onChange={() => handleToggleDependency(cand.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{cand.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px]">
                        {cand.status === 'completed' ? (
                          <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Concluída
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                            {cand.status}
                          </span>
                        )}

                        {wouldCauseCycle && !isChecked && (
                          <span className="text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Ciclo
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {errors.dependencies && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.dependencies}
              </p>
            )}
          </div>

          {/* Rodapé e Ações */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              id="btn-cancel-task-form"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-submit-task-form"
              disabled={isCompleted}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5" /> Salvar Alterações
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" /> Criar Tarefa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
