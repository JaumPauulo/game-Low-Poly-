/**
 * Chat e Feed da Equipe do Escritório (EventFeedPanel).
 *
 * Exibe:
 * - Eventos de sistema e diálogos determinísticos dos agentes
 * - Timestamps baseados no tempo de simulação (mm:ss)
 * - Filtro por agente ou eventos do sistema
 * - Limite de histórico controlado
 * - Scroll inteligente com indicador de novas mensagens flutuante
 */

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  Bot,
  ChevronDown,
  ChevronUp,
  Filter,
  MessageSquare,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AGENT_CATALOG } from '../../game/config/agentCatalog';
import { TeamMessage } from '../../game/simulation/chat/types';
import { useSimulationStore } from '../../game/simulation/simulationStore';

export function EventFeedPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  const teamMessages = useSimulationStore((s) => s.teamMessages);
  const clearTeamMessages = useSimulationStore((s) => s.clearTeamMessages);

  // Scroll controlado e rastreamento de novas mensagens
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const lastSeenLengthRef = useRef(teamMessages.length);

  // Filtra mensagens pelo agente selecionado ou sistema
  const filteredMessages = teamMessages.filter((msg) => {
    if (selectedAgentFilter === 'all') return true;
    if (selectedAgentFilter === 'system') return msg.kind === 'system_event';
    return msg.agentId === selectedAgentFilter;
  });

  // Manipulador de scroll do usuário
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Considera "no fundo" se a distância do final for menor que 40px
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 40;

    isAtBottomRef.current = isNearBottom;

    if (isNearBottom) {
      setHasNewMessagesBelow(false);
      setUnseenCount(0);
      lastSeenLengthRef.current = teamMessages.length;
    }
  };

  // Efeito ao receber novas mensagens
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (teamMessages.length > lastSeenLengthRef.current) {
      const added = teamMessages.length - lastSeenLengthRef.current;

      if (isAtBottomRef.current) {
        // Se o usuário estava no fundo, rola suavemente para o novo conteúdo
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        lastSeenLengthRef.current = teamMessages.length;
        setHasNewMessagesBelow(false);
        setUnseenCount(0);
      } else {
        // Se o usuário estava lendo o histórico acima, não interrompe e mostra indicador
        setHasNewMessagesBelow(true);
        setUnseenCount((prev) => prev + added);
        lastSeenLengthRef.current = teamMessages.length;
      }
    }
  }, [teamMessages]);

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setHasNewMessagesBelow(false);
    setUnseenCount(0);
  };

  const getContextBadge = (context: TeamMessage['context']) => {
    switch (context) {
      case 'task_start':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">Início</span>;
      case 'task_complete':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">Conclusão</span>;
      case 'task_blocked':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">Bloqueio</span>;
      case 'collaboration_request':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-pink-950/80 text-pink-300 border border-pink-800/60">Colaboração</span>;
      case 'coffee_return':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">Café</span>;
      case 'agent_error':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">Alerta</span>;
      case 'progress_commentary':
        return <span className="text-[9px] px-1 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60">Progresso</span>;
      default:
        return null;
    }
  };

  return (
    <div
      id="chat-feed-panel"
      className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-white text-xs w-80 sm:w-96 transition-all flex flex-col max-h-[calc(100vh-140px)]"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/80 border-b border-slate-800 select-none">
        <div
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-slate-200 text-xs">Chat &amp; Feed da Equipe</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {teamMessages.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Limpar histórico */}
          {teamMessages.length > 0 && (
            <button
              type="button"
              onClick={clearTeamMessages}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Limpar histórico de mensagens"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Recolher / Expandir */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Recolher feed' : 'Expandir feed'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Barra de Filtro por Agente */}
          <div className="p-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto scrollbar-none text-[10px]">
            <Filter className="w-3 h-3 text-slate-500 flex-shrink-0 mr-0.5" />
            <button
              type="button"
              onClick={() => setSelectedAgentFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedAgentFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setSelectedAgentFilter('system')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedAgentFilter === 'system'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              Sistema
            </button>

            {AGENT_CATALOG.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgentFilter(agent.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedAgentFilter === agent.id
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: agent.appearance.primaryColor }}
                />
                <span>{agent.name}</span>
              </button>
            ))}
          </div>

          {/* Área de Mensagens com Scroll Controlado */}
          <div className="relative flex-1 flex flex-col min-h-0">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="overflow-y-auto p-2.5 space-y-2.5 flex-1 max-h-72 scrollbar-thin scrollbar-thumb-slate-700"
            >
              {filteredMessages.length === 0 ? (
                <div className="py-8 text-center text-slate-500 italic text-[11px]">
                  Nenhuma mensagem para o filtro selecionado.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  if (msg.kind === 'system_event') {
                    return (
                      <div
                        key={msg.id}
                        className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-start gap-2 text-slate-300"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[10px] font-semibold text-sky-300">
                              Sistema
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {msg.timestampFormatted}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }

                  // Mensagem de Agente
                  return (
                    <div
                      key={msg.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 transition-all hover:border-slate-700/80"
                    >
                      {/* Topo da mensagem: Avatar, Nome, Papel e Timestamp */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full ring-1 ring-white/30"
                            style={{ backgroundColor: msg.agentColor || '#38bdf8' }}
                          />
                          <span className="font-semibold text-slate-200 text-[11px]">
                            {msg.agentName}
                          </span>
                          <span className="text-[9px] text-slate-400 opacity-80 hidden sm:inline">
                            ({msg.agentRole})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {getContextBadge(msg.context)}
                          <span className="text-[9px] font-mono text-slate-400">
                            {msg.timestampFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Texto da fala */}
                      <p className="text-[11px] text-slate-200 pl-3.5 border-l-2 border-slate-800 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Indicador Flutuante de Novas Mensagens */}
            {hasNewMessagesBelow && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-[11px] font-semibold shadow-lg shadow-sky-950/50 border border-sky-400/40 animate-bounce transition-colors"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>
                    Novas mensagens {unseenCount > 0 ? `(+${unseenCount})` : '↓'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
