import { Loader2 } from 'lucide-react';

export function LoadingFallback() {
  return (
    <div
      id="loading-fallback"
      className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 z-20 backdrop-blur-xs transition-opacity duration-300"
    >
      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
        <span className="text-sm font-medium text-slate-700">
          Inicializando motor gráfico 3D...
        </span>
      </div>
    </div>
  );
}
