import { Html } from '@react-three/drei';

interface AgentNameplateProps {
  name: string;
  role: string;
  primaryColor: string;
  isSelected: boolean;
  isHovered: boolean;
}

export function AgentNameplate({
  name,
  role,
  primaryColor,
  isSelected,
  isHovered,
}: AgentNameplateProps) {
  // Exibir placa quando estiver selecionado ou com hover do mouse
  const isVisible = isSelected || isHovered;

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
            isSelected
              ? 'bg-slate-900 text-white ring-2 ring-offset-1 ring-slate-800'
              : 'bg-white/95 text-slate-800 border border-slate-200'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-xs font-semibold tracking-wide">{name}</span>
          {isSelected && (
            <span className="text-[10px] text-slate-300 font-normal border-l border-slate-700 pl-1.5 ml-0.5">
              {role}
            </span>
          )}
        </div>

        {/* Ponteiro sutil triangular apontando para a cabeça */}
        <div
          className={`w-0 h-0 border-x-4 border-x-transparent border-t-4 ${
            isSelected ? 'border-t-slate-900' : 'border-t-white/90'
          }`}
        />
      </div>
    </Html>
  );
}
