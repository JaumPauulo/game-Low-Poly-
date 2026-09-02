import { useFrame } from '@react-three/fiber';
import { AGENT_CATALOG } from '../../config/agentCatalog';
import { simulationBridge } from '../../systems/simulationBridge';
import { useSimulationStore } from '../../simulation/simulationStore';
import { AgentAvatar } from './AgentAvatar';
import { useAgentStore } from './agentStore';

export function AgentGroup() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const agentStates = useAgentStore((state) => state.agentStates);
  const selectAgent = useAgentStore((state) => state.selectAgent);

  const isPaused = useSimulationStore((state) => state.state.isPaused);
  const simAgents = useSimulationStore((state) => state.state.agents);

  // Orquestrador de integração: fixed timestep da simulação lógica + cinemática 3D
  useFrame((_, delta) => {
    simulationBridge.update(delta);
  });

  return (
    <group name="agent-group">
      {AGENT_CATALOG.map((config) => {
        const stateRecord = agentStates[config.id];
        const animation = stateRecord ? stateRecord.animation : config.initialAnimation;
        const isSelected = selectedAgentId === config.id;
        const simAgent = simAgents[config.id];
        const hasError = simAgent?.state === 'error';

        return (
          <AgentAvatar
            key={config.id}
            config={config}
            animationState={animation}
            isSelected={isSelected}
            isPaused={isPaused}
            hasError={hasError}
            onSelect={selectAgent}
          />
        );
      })}
    </group>
  );
}

