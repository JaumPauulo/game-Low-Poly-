/**
 * Gerador de números pseudoaleatórios determinístico (PRNG) baseado em Mulberry32.
 * Garante reprodutibilidade idêntica dada a mesma semente inicial.
 * Nenhuma regra pode depender de Math.random ou Date.now.
 */

export interface RandomSource {
  /** Retorna um número em ponto flutuante no intervalo [0, 1) */
  next(): number;
  /** Retorna um inteiro no intervalo inclusivo [min, max] */
  nextInt(min: number, max: number): number;
  /** Retorna um número em ponto flutuante no intervalo [min, max) */
  nextFloat(min: number, max: number): number;
  /** Retorna o estado interno atual do gerador */
  getState(): number;
  /** Clona a instância preservando exatamente o mesmo estado interno */
  clone(): RandomSource;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    // Normaliza a seed para inteiro não nulo de 32 bits sem sinal
    this.state = (Math.floor(Math.abs(seed)) || 1) >>> 0;
  }

  public next(): number {
    // Algoritmo Mulberry32
    let z = (this.state += 0x6d2b79f5) >>> 0;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    const result = ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    return result;
  }

  public nextInt(min: number, max: number): number {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    const range = max - min + 1;
    return min + Math.floor(this.next() * range);
  }

  public nextFloat(min: number, max: number): number {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return min + this.next() * (max - min);
  }

  public getState(): number {
    return this.state;
  }

  public clone(): RandomSource {
    const copy = new SeededRandom(1);
    copy.state = this.state;
    return copy;
  }
}

/** Cria uma instância de RandomSource a partir de uma seed numérica */
export function createRandomSource(seed: number): RandomSource {
  return new SeededRandom(seed);
}
