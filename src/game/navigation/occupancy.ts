/**
 * Sistema de ocupação e reserva de células para navegação de múltiplos agentes.
 * Estritamente desacoplado de React e Three.js (TypeScript puro).
 */

import { GridCoordinate, NavigationGrid } from './types';
import { isInsideGrid, isWalkable } from './gridUtils';

export interface CellOccupant {
  agentId: string;
  coord: GridCoordinate;
}

export class OccupancyManager {
  // Célula atualmente ocupada por cada agente: agentId -> GridCoordinate
  private agentOccupancies = new Map<string, GridCoordinate>();

  // Células reservadas para o próximo passo: 'x,z' -> agentId
  private cellReservations = new Map<string, string>();

  private coordToKey(coord: GridCoordinate): string {
    return `${coord.x},${coord.z}`;
  }

  /**
   * Registra a célula ocupada por um agente.
   * Libera automaticamente qualquer reserva anterior do mesmo agente.
   */
  occupy(agentId: string, coord: GridCoordinate): boolean {
    const key = this.coordToKey(coord);
    const existingReservation = this.cellReservations.get(key);
    if (existingReservation && existingReservation !== agentId) {
      return false;
    }

    // Libera reserva prévia
    this.releaseReservation(agentId);

    // Registra nova ocupação
    this.agentOccupancies.set(agentId, { x: coord.x, z: coord.z });
    return true;
  }

  /**
   * Tenta reservar uma célula para o próximo passo de um agente.
   * Retorna true se a célula foi reservada com sucesso.
   * Retorna false se a célula já estiver ocupada por outro agente ou reservada.
   */
  reserve(agentId: string, coord: GridCoordinate, grid?: NavigationGrid): boolean {
    if (grid && (!isInsideGrid(coord, grid) || !isWalkable(grid, coord))) {
      return false;
    }

    const key = this.coordToKey(coord);

    // 1. Verifica se já está reservada por outro agente
    const reservingAgent = this.cellReservations.get(key);
    if (reservingAgent && reservingAgent !== agentId) {
      return false;
    }

    // 2. Verifica se já está ocupada fisicamente por outro agente
    for (const [otherAgentId, occupiedCoord] of this.agentOccupancies.entries()) {
      if (otherAgentId !== agentId && occupiedCoord.x === coord.x && occupiedCoord.z === coord.z) {
        return false;
      }
    }

    // Reserva a célula
    this.cellReservations.set(key, agentId);
    return true;
  }

  /**
   * Libera qualquer reserva pendente feita por um agente.
   */
  releaseReservation(agentId: string): void {
    for (const [key, reservingAgent] of this.cellReservations.entries()) {
      if (reservingAgent === agentId) {
        this.cellReservations.delete(key);
      }
    }
  }

  /**
   * Libera ocupação e reservas de um agente.
   */
  release(agentId: string): void {
    this.releaseReservation(agentId);
    this.agentOccupancies.delete(agentId);
  }

  /**
   * Verifica se uma célula está disponível para ser ocupada/reservada por um agente.
   */
  isCellAvailable(coord: GridCoordinate, agentId?: string): boolean {
    const key = this.coordToKey(coord);

    const reservingAgent = this.cellReservations.get(key);
    if (reservingAgent && reservingAgent !== agentId) {
      return false;
    }

    for (const [otherAgentId, occupiedCoord] of this.agentOccupancies.entries()) {
      if (otherAgentId !== agentId && occupiedCoord.x === coord.x && occupiedCoord.z === coord.z) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retorna o ID do agente que ocupa uma coordenada específica, se houver.
   */
  getOccupant(coord: GridCoordinate): string | undefined {
    for (const [agentId, occupiedCoord] of this.agentOccupancies.entries()) {
      if (occupiedCoord.x === coord.x && occupiedCoord.z === coord.z) {
        return agentId;
      }
    }
    return undefined;
  }

  /**
   * Retorna a célula ocupada por um agente.
   */
  getAgentCell(agentId: string): GridCoordinate | undefined {
    return this.agentOccupancies.get(agentId);
  }

  /**
   * Retorna a lista de todas as ocupações ativas.
   */
  getAllOccupiedCells(): CellOccupant[] {
    const list: CellOccupant[] = [];
    for (const [agentId, coord] of this.agentOccupancies.entries()) {
      list.push({ agentId, coord: { ...coord } });
    }
    return list;
  }

  /**
   * Retorna a lista de coordenadas ocupadas por outros agentes como obstáculos para o A*.
   */
  getOtherAgentCoordinates(excludeAgentId: string): GridCoordinate[] {
    const coords: GridCoordinate[] = [];
    for (const [agentId, coord] of this.agentOccupancies.entries()) {
      if (agentId !== excludeAgentId) {
        coords.push({ ...coord });
      }
    }
    return coords;
  }

  /**
   * Reinicia todo o estado de ocupação e reservas.
   */
  reset(): void {
    this.agentOccupancies.clear();
    this.cellReservations.clear();
  }
}
