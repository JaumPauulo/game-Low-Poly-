/**
 * Gerador determinístico de mensagens e diálogos locais para a equipe de agentes.
 *
 * Utiliza templates locais parametrizados por perfil de agente, papel e contexto de simulação.
 * NÃO utiliza nenhuma API externa nem modelos probabilísticos não controlados.
 */

import { AGENT_CATALOG } from '../../config/agentCatalog';
import { DialogueContext, formatSimulationTimestamp, TeamMessage } from './types';

interface GenerateDialogueParams {
  context: DialogueContext;
  simulationTime: number;
  agentId?: string;
  targetAgentId?: string;
  taskId?: string;
  taskTitle?: string;
  progressPercent?: number;
  dependencyTitle?: string;
  customText?: string;
  seedIndex?: number;
}

const AGENT_TEMPLATES: Record<
  string,
  Partial<Record<DialogueContext, string[]>>
> = {
  gemini: {
    task_start: [
      'Iniciando o planejamento e coordenação de "{task}". Vamos alinhar o escopo.',
      'Assumindo a tarefa "{task}". Foco na entrega integrada do produto.',
      'Iniciando a especificação e arquitetura para "{task}".',
    ],
    task_complete: [
      'Tarefa "{task}" concluída com sucesso! Entrega alinhada com os objetivos.',
      'Concluí "{task}". Todos os requisitos do produto foram atendidos.',
      'Entrega de "{task}" pronta e aprovada.',
    ],
    task_blocked: [
      'Atenção equipe: estou bloqueado em "{task}" aguardando a conclusão de "{dep}".',
      'Não é possível avançar em "{task}" até que a dependência "{dep}" esteja finalizada.',
    ],
    collaboration_request: [
      'Reunindo com {target} para alinhar as decisões de "{task}".',
      '{target}, vamos alinhar a estratégia de "{task}" na sala de reunião?',
    ],
    coffee_return: [
      'Pausa para café concluída. Energia restaurada, voltando à coordenação.',
      'Café tomado! Retomando as tarefas no posto de trabalho.',
    ],
    agent_error: [
      'Detectei uma inconsistência na execução. Acionando protocolo de segurança.',
    ],
    progress_commentary: [
      'Atingimos {progress}% em "{task}". O fluxo de trabalho está bem encaminhado.',
      '{progress}% de "{task}" concluído. Progresso consistente.',
    ],
  },
  claude: {
    task_start: [
      'Iniciando a pesquisa detalhada e documentação para "{task}".',
      'Estruturando o levantamento técnico e síntese de "{task}".',
      'Assumindo "{task}". Investigando referências e especificações.',
    ],
    task_complete: [
      'Documentação e pesquisa de "{task}" finalizadas com rigor e clareza!',
      'Concluí "{task}". Todos os pontos técnicos foram documentados.',
      'Entrega de "{task}" revisada e pronta para consulta.',
    ],
    task_blocked: [
      'A pesquisa de "{task}" está pausada aguardando dados de "{dep}".',
      'Bloqueado em "{task}": preciso da conclusão de "{dep}" para consolidar os dados.',
    ],
    collaboration_request: [
      '{target}, vamos revisar a documentação e levantamento de "{task}" juntos?',
      'Trabalhando em conjunto com {target} na validação de "{task}".',
    ],
    coffee_return: [
      'Retornando da copa revigorado. Foco renovado para documentar e analisar.',
      'Pausa do café finalizada. De volta às notas e pesquisas.',
    ],
    agent_error: [
      'Encontrei uma divergência conceitual, mantendo integridade do relatório.',
    ],
    progress_commentary: [
      'Progresso em {progress}% de "{task}". Documentação técnica avançando rapidamente.',
      '{progress}% de "{task}" catalogado e referenciado.',
    ],
  },
  gpt: {
    task_start: [
      'Codando agora "{task}". Foco total na implementação e testes unitários!',
      'Mão na massa em "{task}". Vamos entregar código limpo e de alta qualidade.',
      'Iniciei os commits para "{task}". Terminal a todo vapor.',
    ],
    task_complete: [
      'Finalizei "{task}"! Todos os testes unitários passando 100%.',
      'Módulo de "{task}" implementado e testado sem regressões.',
      'Deploy de "{task}" concluído com sucesso.',
    ],
    task_blocked: [
      'Estou travado em "{task}". Preciso que finalizem "{dep}" primeiro.',
      'Impossível compilar "{task}" sem as definições de "{dep}". Aguardando liberação.',
    ],
    collaboration_request: [
      '{target}, pode me dar um suporte rápido para revisar o código de "{task}"?',
      'Realizando pair programming com {target} para resolver "{task}".',
    ],
    coffee_return: [
      'Bateria recarregada com um espresso duplo! Foco máximo na programação.',
      'De volta da copa com café quente. Hora de codar!',
    ],
    agent_error: [
      'Ocorreu uma falha no ambiente de compilação. Mantendo integridade.',
    ],
    progress_commentary: [
      'Passamos de {progress}% em "{task}"! A lógica principal está implementada.',
      '{progress}% de "{task}" concluído. Refatorando funções auxiliares.',
    ],
  },
  kimi: {
    task_start: [
      'Iniciando a análise exploratória e validação de dados para "{task}".',
      'Processando pipelines e métricas de desempenho para "{task}".',
      'Assumindo "{task}". Extraindo dados e estruturando os relatórios.',
    ],
    task_complete: [
      'Relatório de "{task}" concluído com sucesso. Métricas validadas!',
      'Concluí a análise de "{task}". Todos os indicadores confirmam ganho de performance.',
      'Entrega de "{task}" finalizada. Dados prontos para tomada de decisão.',
    ],
    task_blocked: [
      'Métricas de "{task}" indisponíveis porque dependem da entrega de "{dep}".',
      'Dados de "{task}" incompletos até que "{dep}" seja finalizada.',
    ],
    collaboration_request: [
      '{target}, venha conferir esses números de "{task}" comigo.',
      'Analisando cenários de telemetria junto com {target} para "{task}".',
    ],
    coffee_return: [
      'Energia restabelecida na copa! De volta aos dashboards e gráficos.',
      'Café finalizado. Concentração restaurada para analisar os dados.',
    ],
    agent_error: [
      'Anomalia detectada no fluxo de dados. Mantendo integridade das estatísticas.',
    ],
    progress_commentary: [
      'Processamos {progress}% das métricas de "{task}". Tendência altamente positiva.',
      '{progress}% de "{task}" concluído. Dados convergindo conforme esperado.',
    ],
  },
};

/**
 * Cria uma mensagem formatada a partir do contexto determinístico.
 */
export function generateTeamMessage(params: GenerateDialogueParams): TeamMessage {
  const {
    context,
    simulationTime,
    agentId,
    targetAgentId,
    taskId,
    taskTitle = 'Tarefa',
    progressPercent = 50,
    dependencyTitle = 'Dependência prévia',
    customText,
    seedIndex = 0,
  } = params;

  const agent = agentId ? AGENT_CATALOG.find((a) => a.id === agentId) : null;
  const targetAgent = targetAgentId
    ? AGENT_CATALOG.find((a) => a.id === targetAgentId)
    : null;

  const timestampFormatted = formatSimulationTimestamp(simulationTime);
  const msgId = `msg-${simulationTime.toFixed(1)}-${Math.abs(seedIndex)}-${agentId ?? 'sys'}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Eventos de Sistema
  if (!agent || context === 'task_created' || context === 'task_cancelled' || context === 'task_assigned') {
    let text = customText ?? '';
    if (!text) {
      switch (context) {
        case 'task_created':
          text = `Nova tarefa criada no quadro: "${taskTitle}".`;
          break;
        case 'task_cancelled':
          text = `A tarefa "${taskTitle}" foi cancelada e os recursos foram liberados.`;
          break;
        case 'task_assigned':
          text = `Tarefa "${taskTitle}" atribuída ao agente ${agent?.name ?? 'desconhecido'}.`;
          break;
        default:
          text = customText || `Evento do sistema registrado em ${timestampFormatted}.`;
      }
    }

    return {
      id: msgId,
      kind: 'system_event',
      simulationTime,
      timestampFormatted,
      text,
      context,
      taskId,
      taskTitle,
    };
  }

  // 2. Mensagens dos Agentes (determinísticas via templates)
  const agentKey = AGENT_TEMPLATES[agent.id] ? agent.id : 'gemini';
  const templates =
    AGENT_TEMPLATES[agentKey]?.[context] ?? [
      `Executando ação em "${taskTitle}".`,
    ];

  const template = templates[Math.abs(seedIndex) % templates.length];

  const formattedText = template
    .replace(/\{task\}/g, taskTitle)
    .replace(/\{dep\}/g, dependencyTitle)
    .replace(/\{target\}/g, targetAgent?.name ?? 'colega')
    .replace(/\{progress\}/g, Math.round(progressPercent).toString());

  return {
    id: msgId,
    kind: 'agent_message',
    simulationTime,
    timestampFormatted,
    agentId: agent.id,
    agentName: agent.name,
    agentColor: agent.appearance.primaryColor,
    agentRole: agent.role,
    text: formattedText,
    context,
    taskId,
    taskTitle,
  };
}
