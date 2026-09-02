/**
 * Utilitários para detecção e validação de suporte a WebGL.
 */

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || !window.document) {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl && typeof (gl as WebGLRenderingContext).getParameter === 'function');
  } catch {
    return false;
  }
}
