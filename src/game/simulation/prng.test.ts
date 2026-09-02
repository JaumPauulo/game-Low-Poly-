import { describe, expect, it } from 'vitest';
import { createRandomSource, SeededRandom } from './prng';

describe('PRNG determinístico (Mulberry32)', () => {
  it('mesma seed gera exatamente a mesma sequência de números float', () => {
    const prng1 = createRandomSource(12345);
    const prng2 = createRandomSource(12345);

    const seq1 = Array.from({ length: 20 }, () => prng1.next());
    const seq2 = Array.from({ length: 20 }, () => prng2.next());

    expect(seq1).toEqual(seq2);
    expect(seq1.length).toBe(20);
    // Garante que os números estão no intervalo [0, 1)
    seq1.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });
  });

  it('seeds diferentes geram sequências distintas', () => {
    const prng1 = createRandomSource(42);
    const prng2 = createRandomSource(999);

    const val1 = prng1.next();
    const val2 = prng2.next();

    expect(val1).not.toBe(val2);
  });

  it('nextInt respeita os limites [min, max] inclusive', () => {
    const prng = new SeededRandom(777);
    for (let i = 0; i < 50; i++) {
      const val = prng.nextInt(3, 8);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(8);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('clone reproduz fielmente a sequência a partir do mesmo ponto', () => {
    const original = createRandomSource(2026);
    // Avança 5 iterações
    for (let i = 0; i < 5; i++) {
      original.next();
    }

    const cloned = original.clone();
    for (let i = 0; i < 10; i++) {
      expect(original.next()).toBe(cloned.next());
    }
  });
});
