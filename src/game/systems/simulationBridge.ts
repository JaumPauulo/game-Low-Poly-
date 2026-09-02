/**
 * Sistema de integração (SimulationBridge).
 *
 * Conecta:
 * 1. O motor de simulação lógico determinístico (SimulationState)
 * 2. O subsistema de navegação A* e prevenção de colisões (AgentMovementStore)
 * 3. O subsistema de animações dos rigs 3D (AgentStore)
 * 4. As zonas e pontos de interação do escritório (OfficeZones)
 *
 * Garante que a cena Three.js NÃO altere regras de produtividade,
 * atuando puramente como executor cinemático e representação visual.
 */

import {
  getAvailableInteractionPoint,
  OFFICE_ZONES,
  ZoneInteractionPoint,
  ZoneType,
} from '../config/officeZones';
import { rawAgentMovementStore } from '../entities/agents/agentMovementStore';
import { rawAgentStore } from '../entities/agents/agentStore';
import { AgentAnimationState, AgentId } from '../entities/agents/types';
import { setAgentDestination } from '../navigation/movement';
import { rawSimulationStore } from '../simulation/simulationStore';
import { AgentState, SimulationCommand } from '../simulation/types';

/**
 * Mapeia os estados lógicos do modelo de simulação para animações visuais do avatar 3D.
 */
export function mapAgentStateToAnimation(state: AgentState): AgentAnimationState {
  switch (state) {
    case 'idle':
      return 'idle';
    case 'planning':
      return 'thinking';
    case 'walking':
      return 'walking';
    case 'working':
      return 'working';
    case 'thinking':
      return 'thinking';
    case 'collaborating':
      return 'talking';
    case 'coffee':
      return 'coffee';
    case 'talking':
      return 'talking';
    case 'error':
      return 'idle'; // Postura segura com indicador visual
  }
}

export class SimulationBridge {
  private accumulator = 0;
  private occupiedPoints = new Map<string, string>(); // agentId -> pointId

  /**
   * Reseta o estado interno da ponte de integração.
   */
  public reset(): void {
    this.accumulator = 0;
    this.occupiedPoints.clear();
  }

  /**
   * Executa o loop de fixed timestep integrando simulação lógica e cinemática 3D.
   */
  public update(deltaSeconds: number): void {
    const simStore = rawSimulationStore.getState();
    const isPaused = simStore.state.isPaused;
    const timeScale = simStore.state.timeScale;
    const fixedTimestep = simStore.state.config.fixedTimestepSeconds;

    if (isPaused) {
      return;
    }

    // 1. Avança o acumulador de fixed timestep com escala de velocidade
    const scaledDelta = deltaSeconds * timeScale;
    this.accumulator += scaledDelta;

    // Previne espiral da morte se houver salto extremo de frames
    if (this.accumulator > 1.0) {
      this.accumulator = 1.0;
    }

    while (this.accumulator >= fixedTimestep) {
      // Executa um passo do motor lógico puro
      const { commands } = rawSimulationStore.getState().tick(fixedTimestep);

      // Interpreta e despacha os comandos gerados pela simulação
      this.processCommands(commands);

      this.accumulator -= fixedTimestep;
    }

    // 2. Atualiza a cinemática de movimento no mundo 3D
    this.updateMovement(scaledDelta, isPaused);

    // 3. Sincroniza animações visuais com os estados lógicos atuais
    this.syncAnimations();
  }

  /**
   * Interpreta os comandos emitidos pelo motor de simulação.
   */
  private processCommands(commands: SimulationCommand[]): void {
    for (const cmd of commands) {
      switch (cmd.type) {
        case 'MOVE_TO_ZONE': {
          this.handleMoveToZone(cmd.agentId as AgentId, cmd.targetZoneId as ZoneType);
          break;
        }

        case 'START_WORK': {
          rawAgentStore.getState().setAgentAnimation(cmd.agentId as AgentId, 'working');
          break;
        }

        case 'START_COFFEE_BREAK': {
          rawAgentStore.getState().setAgentAnimation(cmd.agentId as AgentId, 'coffee');
          break;
        }

        case 'START_COLLABORATION': {
          // Garante que o parceiro e o agente principal fiquem em posições válidas de reunião
          this.handleMoveToZone(cmd.agentId as AgentId, 'meeting');
          this.handleMoveToZone(cmd.targetAgentId as AgentId, 'meeting');
          break;
        }

        case 'EMIT_MESSAGE': {
          // Mensagem informativa processada pelo feed de eventos
          break;
        }
      }
    }
  }

  /**
   * Atribui e comanda o deslocamento de um agente para uma zona específica.
   */
  private handleMoveToZone(agentId: AgentId, targetZoneId: ZoneType): void {
    const movementStore = rawAgentMovementStore.getState();
    const movement = movementStore.movements[agentId];
    if (!movement) return;

    // Encontra um ponto de interação acessível e livre na zona
    const currentlyOccupied = new Set(this.occupiedPoints.values());
    const interactionPoint = getAvailableInteractionPoint(targetZoneId, agentId, currentlyOccupied);

    if (!interactionPoint) {
      return;
    }

    // Se o agente já está na célula do destino, produz chegada imediata
    if (
      movement.currentGrid.x === interactionPoint.gridCoordinate.x &&
      movement.currentGrid.z === interactionPoint.gridCoordinate.z
    ) {
      movement.rotationY = interactionPoint.preferredRotationY;
      rawSimulationStore.getState().notifyAgentArrival(agentId, targetZoneId);
      this.occupiedPoints.set(agentId, interactionPoint.id);
      return;
    }

    // Registra a reserva do ponto
    this.occupiedPoints.set(agentId, interactionPoint.id);

    // Comanda o pathfinding e o deslocamento
    const success = setAgentDestination(
      movement,
      interactionPoint.gridCoordinate,
      movementStore.grid,
      movementStore.occupancy
    );

    if (success) {
      // Define animação de caminhada
      rawAgentStore.getState().setAgentAnimation(agentId, 'walking');
    }
  }

  /**
   * Atualiza a cinemática e monitora a chegada dos personagens nas células de destino.
   */
  private updateMovement(scaledDelta: number, isPaused: boolean): void {
    const movementStore = rawAgentMovementStore.getState();
    const simState = rawSimulationStore.getState().state;

    // Executa o passo cinemático de navegação
    movementStore.tick(scaledDelta, isPaused);

    // Verifica quais agentes completaram seus caminhos para produzir eventos de chegada
    for (const [agentId, agent] of Object.entries(simState.agents)) {
      const movement = movementStore.movements[agentId as AgentId];
      if (!movement) continue;

      // Se o agente estava caminhando e o movimento finalizou
      if (agent.state === 'walking' && !movement.isMoving && movement.status === 'idle') {
        const targetZone = agent.targetZoneId ?? agent.currentZoneId;

        // Atualiza formalmente a chegada na simulação
        rawSimulationStore.getState().notifyAgentArrival(agentId, targetZone);

        // Alinha a orientação final ao ponto de interação correspondente
        const pointId = this.occupiedPoints.get(agentId);
        if (pointId) {
          const zoneConfig = OFFICE_ZONES[targetZone as ZoneType];
          const point = zoneConfig?.interactionPoints.find((p: ZoneInteractionPoint) => p.id === pointId);
          if (point) {
            movement.rotationY = point.preferredRotationY;
          }
        }
      }
    }
  }

  /**
   * Sincroniza o estado de animação de cada avatar com o estado da simulação lógica.
   */
  private syncAnimations(): void {
    const simAgents = rawSimulationStore.getState().state.agents;
    const agentStore = rawAgentStore.getState();
    const movements = rawAgentMovementStore.getState().movements;

    for (const [id, agent] of Object.entries(simAgents)) {
      const agentId = id as AgentId;
      const movement = movements[agentId];

      let targetAnim: AgentAnimationState;

      // Se o agente está se movimentando no mundo, a animação visual é walking
      if (movement && movement.isMoving) {
        targetAnim = 'walking';
      } else {
        targetAnim = mapAgentStateToAnimation(agent.state);
      }

      if (agentStore.agentStates[agentId]?.animation !== targetAnim) {
        agentStore.setAgentAnimation(agentId, targetAnim);
      }
    }
  }
}

// Instância singleton da ponte de simulação
export const simulationBridge = new SimulationBridge();
