import { AlertTriangle } from 'lucide-react';
import { Html } from '@react-three/drei';

interface AgentNameplateProps {
  name: string;
  role: string;
  primaryColor: string;
  isSelected: boolean;
  isHovered: boolean;
  hasError?: boolean;
}

export function AgentNameplate({
  name,
  role,
  primaryColor,
  isSelected,
  isHovered,
  hasError = false,
}: AgentNameplateProps) {
  // Exibir placa quando estiver selecionado, com hover ou em estado de erro
  const isVisible = isSelected || isHovered || hasError;

  if (!isVisible) {
    return null;
  }

  return (
    <Html
      position={[0, 1.25, 0]}
      center
      zIndexRange={[5, 0]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div className="flex flex-col items-center">
        {/* Caixa da placa */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md transition-all whitespace-nowrap ${
            hasError
              ? 'bg-rose-950/90 text-rose-100 border border-rose-500/50'
              : isSelected
              ? 'bg-slate-900 text-white ring-2 ring-offset-1 ring-slate-800'
              : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          {hasError ? (
            <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
          ) : (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
          )}

          <span className="text-xs font-semibold tracking-wide">{name}</span>

          {hasError && (
            <span className="text-[10px] text-rose-300 font-medium border-l border-rose-800 pl-1.5 ml-0.5">
              Defensivo
            </span>
          )}

          {isSelected && !hasError && (
            <span className="text-[10px] text-slate-300 font-normal border-l border-slate-700 pl-1.5 ml-0.5">
              {role}
            </span>
          )}
        </div>

        {/* Ponteiro sutil triangular apontando para a cabeça */}
        <div
          className={`w-0 h-0 border-x-4 border-x-transparent border-t-4 ${
            hasError
              ? 'border-t-rose-950/90'
              : isSelected
              ? 'border-t-slate-900'
              : 'border-t-white/90'
          }`}
        />
      </div>
    </Html>
  );
}

