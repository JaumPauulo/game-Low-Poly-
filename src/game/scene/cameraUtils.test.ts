import { describe, expect, it } from 'vitest';
import {
  calculateResponsiveZoom,
  clampZoomMultiplier,
  getCameraPositionForAngle,
  getRotationAngleDegrees,
  ISOMETRIC_POSITIONS,
  normalizeRotationIndex,
} from './cameraUtils';

describe('cameraUtils', () => {
  describe('normalizeRotationIndex', () => {
    it('mantém índices no intervalo 0 a 3', () => {
      expect(normalizeRotationIndex(0)).toBe(0);
      expect(normalizeRotationIndex(1)).toBe(1);
      expect(normalizeRotationIndex(2)).toBe(2);
      expect(normalizeRotationIndex(3)).toBe(3);
    });

    it('faz wrap-around correto para valores positivos', () => {
      expect(normalizeRotationIndex(4)).toBe(0);
      expect(normalizeRotationIndex(5)).toBe(1);
      expect(normalizeRotationIndex(7)).toBe(3);
    });

    it('faz wrap-around correto para valores negativos', () => {
      expect(normalizeRotationIndex(-1)).toBe(3);
      expect(normalizeRotationIndex(-2)).toBe(2);
      expect(normalizeRotationIndex(-4)).toBe(0);
      expect(normalizeRotationIndex(-5)).toBe(3);
    });
  });

  describe('getRotationAngleDegrees', () => {
    it('retorna os 4 ângulos ortogonais corretos', () => {
      expect(getRotationAngleDegrees(0)).toBe(45);
      expect(getRotationAngleDegrees(1)).toBe(135);
      expect(getRotationAngleDegrees(2)).toBe(225);
      expect(getRotationAngleDegrees(3)).toBe(315);
    });
  });

  describe('getCameraPositionForAngle e ISOMETRIC_POSITIONS', () => {
    it('as posições pré-calculadas correspondem aos ângulos de 90 graus', () => {
      // 45 graus: x=20, y=20, z=20
      const pos0 = getCameraPositionForAngle(45);
      expect(Math.round(pos0[0])).toBe(20);
      expect(Math.round(pos0[1])).toBe(20);
      expect(Math.round(pos0[2])).toBe(20);
      expect(ISOMETRIC_POSITIONS[0]).toEqual([20, 20, 20]);

      // 135 graus: x=-20, y=20, z=20
      const pos1 = getCameraPositionForAngle(135);
      expect(Math.round(pos1[0])).toBe(-20);
      expect(Math.round(pos1[1])).toBe(20);
      expect(Math.round(pos1[2])).toBe(20);
      expect(ISOMETRIC_POSITIONS[1]).toEqual([-20, 20, 20]);

      // 225 graus: x=-20, y=20, z=-20
      const pos2 = getCameraPositionForAngle(225);
      expect(Math.round(pos2[0])).toBe(-20);
      expect(Math.round(pos2[1])).toBe(20);
      expect(Math.round(pos2[2])).toBe(-20);
      expect(ISOMETRIC_POSITIONS[2]).toEqual([-20, 20, -20]);

      // 315 graus: x=20, y=20, z=-20
      const pos3 = getCameraPositionForAngle(315);
      expect(Math.round(pos3[0])).toBe(20);
      expect(Math.round(pos3[1])).toBe(20);
      expect(Math.round(pos3[2])).toBe(-20);
      expect(ISOMETRIC_POSITIONS[3]).toEqual([20, 20, -20]);
    });
  });

  describe('calculateResponsiveZoom', () => {
    it('retorna fallback razoável para dimensões zeradas ou negativas', () => {
      expect(calculateResponsiveZoom(0, 0)).toBe(42);
      expect(calculateResponsiveZoom(-100, 500)).toBe(42);
    });

    it('calcula zoom proporcional para tela Full HD (1920x1080)', () => {
      const zoom = calculateResponsiveZoom(1920, 1080);
      expect(zoom).toBeGreaterThanOrEqual(50);
      expect(zoom).toBeLessThanOrEqual(65);
    });

    it('calcula zoom adaptado para celular portrait (390x844)', () => {
      const zoom = calculateResponsiveZoom(390, 844);
      expect(zoom).toBeGreaterThanOrEqual(16);
      expect(zoom).toBeLessThanOrEqual(25);
    });

    it('respeita os limites mínimos e máximos globais', () => {
      const ultraWide = calculateResponsiveZoom(3840, 2160);
      expect(ultraWide).toBeLessThanOrEqual(95);

      const tinyScreen = calculateResponsiveZoom(100, 100);
      expect(tinyScreen).toBeGreaterThanOrEqual(16);
    });
  });

  describe('clampZoomMultiplier', () => {
    it('limita multiplicadores fora do intervalo permitido', () => {
      expect(clampZoomMultiplier(0.1)).toBe(0.6);
      expect(clampZoomMultiplier(3.0)).toBe(1.8);
      expect(clampZoomMultiplier(1.0)).toBe(1.0);
      expect(clampZoomMultiplier(1.4)).toBe(1.4);
    });
  });
});
