import { describe, expect, it } from 'vitest';
import { OccupancyManager } from './occupancy';

describe('OccupancyManager', () => {
  it('deve registrar ocupação exclusiva para um agente', () => {
    const manager = new OccupancyManager();
    const result = manager.occupy('gemini', { x: 4, z: 4 });

    expect(result).toBe(true);
    expect(manager.getAgentCell('gemini')).toEqual({ x: 4, z: 4 });
    expect(manager.getOccupant({ x: 4, z: 4 })).toBe('gemini');
  });

  it('não deve permitir que outro agente reserve uma célula ocupada', () => {
    const manager = new OccupancyManager();
    manager.occupy('gemini', { x: 4, z: 4 });

    // Claude tenta reservar a mesma célula
    const claudeReserved = manager.reserve('claude', { x: 4, z: 4 });
    expect(claudeReserved).toBe(false);

    // Gemini (o dono) pode reservar sua própria célula se necessário
    const geminiReserved = manager.reserve('gemini', { x: 4, z: 4 });
    expect(geminiReserved).toBe(true);
  });

  it('não deve permitir que dois agentes reservem a mesma célula vazia', () => {
    const manager = new OccupancyManager();

    // Célula vazia (5, 5)
    expect(manager.isCellAvailable({ x: 5, z: 5 })).toBe(true);

    // Claude reserva primeiro
    const claudeRes = manager.reserve('claude', { x: 5, z: 5 });
    expect(claudeRes).toBe(true);

    // GPT tenta reservar a mesma célula já reservada por Claude
    const gptRes = manager.reserve('gpt', { x: 5, z: 5 });
    expect(gptRes).toBe(false);
  });

  it('deve liberar reserva ao ocupar outra célula ou chamar releaseReservation', () => {
    const manager = new OccupancyManager();

    manager.occupy('claude', { x: 2, z: 2 });
    manager.reserve('claude', { x: 2, z: 3 });

    expect(manager.isCellAvailable({ x: 2, z: 3 }, 'gpt')).toBe(false);

    // Claude se move para (2, 3) e ocupa ela
    manager.occupy('claude', { x: 2, z: 3 });

    // Célula antiga (2, 2) está livre
    expect(manager.isCellAvailable({ x: 2, z: 2 }, 'gpt')).toBe(true);
    expect(manager.getAgentCell('claude')).toEqual({ x: 2, z: 3 });
  });

  it('deve listar coordenadas ocupadas por outros agentes para alimentar A*', () => {
    const manager = new OccupancyManager();
    manager.occupy('gemini', { x: 1, z: 1 });
    manager.occupy('claude', { x: 2, z: 2 });
    manager.occupy('gpt', { x: 3, z: 3 });

    const othersForGemini = manager.getOtherAgentCoordinates('gemini');
    expect(othersForGemini).toHaveLength(2);
    expect(othersForGemini).toContainEqual({ x: 2, z: 2 });
    expect(othersForGemini).toContainEqual({ x: 3, z: 3 });
    expect(othersForGemini).not.toContainEqual({ x: 1, z: 1 });
  });
});
