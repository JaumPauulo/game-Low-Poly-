import { describe, expect, it } from 'vitest';
import { isWebGLAvailable } from './webgl';

describe('isWebGLAvailable', () => {
  it('retorna um booleano de forma segura em qualquer ambiente', () => {
    const result = isWebGLAvailable();
    expect(typeof result).toBe('boolean');
  });
});
