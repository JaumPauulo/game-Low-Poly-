import { Box, Layers, Sparkles } from 'lucide-react';

export function UIOverlay() {
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
            <p className="text-xs text-slate-500">Fundação Técnica 3D • TestScene</p>
          </div>
        </div>

        <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-xs text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">WebGL & Shadows OK</span>
        </div>
      </header>

      {/* Rodapé informativo discreto */}
      <footer className="w-full max-w-7xl mx-auto flex items-end justify-between">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs border border-slate-200/80 px-4 py-3 rounded-xl shadow-xs max-w-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Câmera Isométrica Ortográfica</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Visão 3/4 sem distorção angular de perspectiva. Geometrias em profundidades distintas
            mantêm escala aparente idêntica.
          </p>
        </div>

        <div className="pointer-events-auto hidden md:flex items-center gap-2 text-xs text-slate-500 bg-white/90 border border-slate-200/80 px-3 py-1.5 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Low Poly Procedural • Zero external assets</span>
        </div>
      </footer>
    </div>
  );
}
