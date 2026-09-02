import { describe, expect, it } from 'vitest';
import { OFFICE_LAYOUT_CONFIG } from './officeLayout';

describe('OFFICE_LAYOUT_CONFIG', () => {
  it('respeita a geometria de grid de 12x9 células com tamanho 1.2', () => {
    expect(OFFICE_LAYOUT_CONFIG.grid.cols).toBe(12);
    expect(OFFICE_LAYOUT_CONFIG.grid.rows).toBe(9);
    expect(OFFICE_LAYOUT_CONFIG.grid.cellSize).toBe(1.2);
    expect(OFFICE_LAYOUT_CONFIG.grid.totalWidth).toBeCloseTo(14.4);
    expect(OFFICE_LAYOUT_CONFIG.grid.totalDepth).toBeCloseTo(10.8);
  });

  it('possui 4 estações de trabalho e 4 cadeiras de reunião', () => {
    expect(OFFICE_LAYOUT_CONFIG.desks).toHaveLength(4);
    expect(OFFICE_LAYOUT_CONFIG.meeting.chairs).toHaveLength(4);
  });

  it('todos os objetos e postos estão contidos dentro dos limites do diorama', () => {
    const halfWidth = OFFICE_LAYOUT_CONFIG.grid.totalWidth / 2;
    const halfDepth = OFFICE_LAYOUT_CONFIG.grid.totalDepth / 2;

    // Verificar mesas de trabalho
    for (const desk of OFFICE_LAYOUT_CONFIG.desks) {
      expect(Math.abs(desk.position[0])).toBeLessThan(halfWidth);
      expect(Math.abs(desk.position[2])).toBeLessThan(halfDepth);
    }

    // Verificar mesa de reunião
    expect(Math.abs(OFFICE_LAYOUT_CONFIG.meeting.tablePosition[0])).toBeLessThan(halfWidth);
    expect(Math.abs(OFFICE_LAYOUT_CONFIG.meeting.tablePosition[2])).toBeLessThan(halfDepth);

    // Verificar balcão de café e lounge
    expect(Math.abs(OFFICE_LAYOUT_CONFIG.coffeeStation.counterPosition[0])).toBeLessThan(halfWidth);
    expect(Math.abs(OFFICE_LAYOUT_CONFIG.lounge.sofaPosition[0])).toBeLessThan(halfWidth);
  });

  it('mantém o corredor central desobstruído no cruzamento principal', () => {
    // Ponto [0, 0] deve estar livre de qualquer obstáculo estático
    const centerPoint = { x: 0, z: 0 };
    const isBlocked = OFFICE_LAYOUT_CONFIG.staticObstacles.some((obs) => {
      return (
        centerPoint.x >= obs.minX &&
        centerPoint.x <= obs.maxX &&
        centerPoint.z >= obs.minZ &&
        centerPoint.z <= obs.maxZ
      );
    });

    expect(isBlocked).toBe(false);
  });
});
