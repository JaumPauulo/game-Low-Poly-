import { describe, expect, it } from 'vitest';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';

describe('Office Geometry and Zones Consistency', () => {
  it('garante que a base flutuante possui altura ~0.45 e paredes com altura ~3.5', () => {
    expect(OFFICE_LAYOUT_CONFIG.diorama.baseHeight).toBeCloseTo(0.45);
    expect(OFFICE_LAYOUT_CONFIG.diorama.wallHeight).toBeCloseTo(3.5);
    expect(OFFICE_LAYOUT_CONFIG.diorama.wallThickness).toBeCloseTo(0.25);
  });

  it('verifica que existem 4 zonas corporativas definidas com nomes válidos', () => {
    const zoneIds = OFFICE_LAYOUT_CONFIG.zones.map((z) => z.id);
    expect(zoneIds).toContain('workstations');
    expect(zoneIds).toContain('meeting');
    expect(zoneIds).toContain('coffee');
    expect(zoneIds).toContain('lounge');
  });

  it('garante que cada estação de trabalho possui mesa, cadeira e computador associados', () => {
    expect(OFFICE_LAYOUT_CONFIG.desks).toHaveLength(4);
    OFFICE_LAYOUT_CONFIG.desks.forEach((desk) => {
      expect(desk.id).toBeDefined();
      expect(desk.position).toHaveLength(3);
      expect(desk.chairOffset).toHaveLength(3);
      expect(typeof desk.hasLaptop).toBe('boolean');
    });
  });

  it('garante que a mesa de reunião possui 4 cadeiras distribuídas simetricamente', () => {
    const chairs = OFFICE_LAYOUT_CONFIG.meeting.chairs;
    expect(chairs).toHaveLength(4);
    // 2 cadeiras no lado norte (rotationY = 0) e 2 no lado sul (rotationY = Math.PI)
    const northChairs = chairs.filter((c) => c.rotationY === 0);
    const southChairs = chairs.filter((c) => Math.abs(c.rotationY - Math.PI) < 0.001);
    expect(northChairs).toHaveLength(2);
    expect(southChairs).toHaveLength(2);
  });

  it('verifica que a área de café possui balcão, cafeteira e banquetas', () => {
    const coffee = OFFICE_LAYOUT_CONFIG.coffeeStation;
    expect(coffee.counterPosition).toBeDefined();
    expect(coffee.counterSize).toHaveLength(3);
    expect(coffee.machinePosition).toBeDefined();
    expect(coffee.stools.length).toBeGreaterThanOrEqual(2);
  });

  it('verifica que o lounge possui sofá, mesa de centro, tapete e luminária', () => {
    const lounge = OFFICE_LAYOUT_CONFIG.lounge;
    expect(lounge.sofaPosition).toBeDefined();
    expect(lounge.coffeeTablePosition).toBeDefined();
    expect(lounge.rugPosition).toBeDefined();
    expect(lounge.lampPosition).toBeDefined();
  });

  it('confirma presença de plantas decorativas low-poly distribuídas no espaço', () => {
    expect(OFFICE_LAYOUT_CONFIG.plants.length).toBeGreaterThanOrEqual(3);
  });
});
