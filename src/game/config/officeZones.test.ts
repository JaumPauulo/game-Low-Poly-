import { describe, expect, it } from 'vitest';
import {
  getAvailableInteractionPoint,
  getZoneInteractionPoints,
  OFFICE_ZONES,
  ZoneType,
} from './officeZones';
import { createNavigationGrid, worldToGrid } from '../navigation/gridUtils';
import { STATIC_OBSTACLES } from './officeLayout';

describe('Configuração de Zonas e Pontos de Interação (officeZones.ts)', () => {
  const grid = createNavigationGrid(12, 9, 1.2, STATIC_OBSTACLES);

  const REQUIRED_ZONES: ZoneType[] = [
    'workstations',
    'coffee',
    'meeting',
    'lounge',
    'spawn',
    'walkable',
  ];

  it('deve conter exatamente as 6 zonas configuráveis obrigatórias', () => {
    for (const zoneId of REQUIRED_ZONES) {
      expect(OFFICE_ZONES[zoneId]).toBeDefined();
      expect(OFFICE_ZONES[zoneId].id).toBe(zoneId);
      expect(OFFICE_ZONES[zoneId].interactionPoints.length).toBeGreaterThan(0);
    }
  });

  it('todos os pontos de interação devem ser válidos e acessíveis no grid', () => {
    for (const zone of Object.values(OFFICE_ZONES)) {
      for (const point of zone.interactionPoints) {
        expect(point.zoneId).toBe(zone.id);
        expect(point.worldPosition).toBeDefined();
        expect(point.gridCoordinate).toBeDefined();

        // O ponto deve estar dentro dos limites do grid (12x9)
        expect(point.gridCoordinate.x).toBeGreaterThanOrEqual(0);
        expect(point.gridCoordinate.x).toBeLessThan(grid.columns);
        expect(point.gridCoordinate.z).toBeGreaterThanOrEqual(0);
        expect(point.gridCoordinate.z).toBeLessThan(grid.rows);

        // A célula no grid deve ser transitável (não colide diretamente com obstáculo intransitável)
        const cell = grid.cells[point.gridCoordinate.z][point.gridCoordinate.x];
        expect(cell.isWalkable).toBe(true);
      }
    }
  });

  it('deve retornar pontos atribuídos para agentes com mesas em workstations', () => {
    const gptPoint = getAvailableInteractionPoint('workstations', 'gpt', new Set());
    expect(gptPoint).toBeDefined();
    expect(gptPoint?.assignedAgentId).toBe('gpt');
    expect(gptPoint?.id).toBe('ws-desk-gpt');

    const claudePoint = getAvailableInteractionPoint('workstations', 'claude', new Set());
    expect(claudePoint).toBeDefined();
    expect(claudePoint?.assignedAgentId).toBe('claude');
    expect(claudePoint?.id).toBe('ws-desk-claude');
  });

  it('não deve retornar pontos já ocupados (prevenindo sobreposição de agentes)', () => {
    const occupied = new Set(['ws-desk-gpt']);
    const point = getAvailableInteractionPoint('workstations', 'gpt', occupied);
    expect(point).toBeDefined();
    expect(point?.id).not.toBe('ws-desk-gpt');
  });

  it('deve fornecer pelo menos 2 pontos distintos para a sala de reunião (colaboração)', () => {
    const meetingPoints = getZoneInteractionPoints('meeting');
    expect(meetingPoints.length).toBeGreaterThanOrEqual(2);

    const occupied = new Set<string>();
    const point1 = getAvailableInteractionPoint('meeting', 'gemini', occupied);
    expect(point1).toBeDefined();
    occupied.add(point1!.id);

    const point2 = getAvailableInteractionPoint('meeting', 'claude', occupied);
    expect(point2).toBeDefined();
    expect(point2!.id).not.toBe(point1!.id);
  });
});
