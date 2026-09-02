/**
 * Painel de Controles da Simulação (SimulationControls).
 *
 * Oferece controles funcionais:
 * - Pause / Retomar
 * - Velocidades 1x, 2x, 4x
 * - Reset do Cenário
 * - Exibição da seed determinística em modo debug
 */

import { useState } from 'react';
import { Bug, FastForward, Pause, Play, RotateCcw } from 'lucide-react';
import { simulationBridge } from '../../game/systems/simulationBridge';
import { useSimulationStore } from '../../game/simulation/simulationStore';

export function SimulationControls() {
  const isPaused = useSimulationStore((s) => s.state.isPaused);
  const timeScale = useSimulationStore((s) => s.state.timeScale);
  const seed = useSimulationStore((s) => s.state.seed);
  const simulationTime = useSimulationStore((s) => s.state.simulationTime);
  const tickCount = useSimulationStore((s) => s.state.tickCount);

  const togglePause = useSimulationStore((s) => s.togglePause);
  const setTimeScale = useSimulationStore((s) => s.setTimeScale);
  const resetScenario = useSimulationStore((s) => s.resetScenario);

  const [showDebugSeed, setShowDebugSeed] = useState(false);

  const handleReset = () => {
    simulationBridge.reset();
    resetScenario();
  };

  const formatSimTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-white shadow-lg flex items-center gap-3">
      {/* Botão Play / Pause */}
      <button
        type="button"
        onClick={togglePause}
        className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
          isPaused
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-amber-600 hover:bg-amber-500 text-white'
        }`}
        title={isPaused ? 'Iniciar simulação' : 'Pausar simulação'}
      >
        {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
      </button>

      {/* Seletor de Velocidade (1x, 2x, 4x) */}
      <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800 text-xs font-semibold">
        {([1, 2, 4] as const).map((scale) => (
          <button
            key={scale}
            type="button"
            onClick={() => setTimeScale(scale)}
            className={`px-2.5 py-1 rounded transition-colors ${
              timeScale === scale
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {scale}x
          </button>
        ))}
      </div>

      {/* Relógio da Simulação */}
      <div className="flex flex-col text-right px-1 min-w-[58px]">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Tempo</span>
        <span className="text-xs font-mono font-bold text-slate-200">{formatSimTime(simulationTime)}</span>
      </div>

      <div className="h-6 w-px bg-slate-800" />

      {/* Botão de Reset */}
      <button
        type="button"
        onClick={handleReset}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
        title="Resetar Cenário para Estado Inicial"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Alternar Debug Seed */}
      <button
        type="button"
        onClick={() => setShowDebugSeed(!showDebugSeed)}
        className={`p-1.5 rounded-lg transition-colors ${
          showDebugSeed
            ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
        }`}
        title="Exibir informações de Debug e Seed"
      >
        <Bug className="w-4 h-4" />
      </button>

      {/* Exibição da Seed em modo Debug */}
      {showDebugSeed && (
        <div className="flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1 rounded-md border border-cyan-800/60 text-[11px] font-mono text-cyan-300">
          <span className="text-slate-400">Seed:</span>
          <span className="font-bold">{seed}</span>
          <span className="text-slate-500 text-[10px] ml-1">#{tickCount}t</span>
        </div>
      )}
    </div>
  );
}
