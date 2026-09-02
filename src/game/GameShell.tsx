import { Suspense, useEffect, useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { GameErrorBoundary } from '../ui/components/GameErrorBoundary';
import { LoadingFallback } from '../ui/components/LoadingFallback';
import { WebGLFallback } from '../ui/components/WebGLFallback';
import { UIOverlay } from '../ui/panels/UIOverlay';
import { isWebGLAvailable } from '../utils/webgl';
import { GameCanvas } from './scene/GameCanvas';

export function GameShell() {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  // Registra os atalhos globais (Esc, Space, 1/2/4, Q/E, F, R) respeitando campos de texto
  useKeyboardShortcuts();

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  // Se ainda estiver verificando o ambiente no primeiro frame
  if (hasWebGL === null) {
    return <LoadingFallback />;
  }

  // Se o dispositivo ou navegador não suportar aceleração WebGL
  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  return (
    <main
      id="game-shell"
      className="w-full h-screen relative overflow-hidden bg-slate-100 select-none"
    >
      <GameErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <GameCanvas />
        </Suspense>
        <UIOverlay />
      </GameErrorBoundary>
    </main>
  );
}
