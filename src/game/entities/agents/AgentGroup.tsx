import { useFrame } from '@react-three/fiber';
import { AGENT_CATALOG } from '../../config/agentCatalog';
import { AgentAvatar } from './AgentAvatar';
import { rawAgentMovementStore } from './agentMovementStore';
import { useAgentStore } from './agentStore';

export function AgentGroup() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const agentStates = useAgentStore((state) => state.agentStates);
  const isPaused = useAgentStore((state) => state.isPaused);
  const selectAgent = useAgentStore((state) => state.selectAgent);

  // Orquestrador de tick de simulação da cinemática e ocupação de todos os agentes
  useFrame((_, delta) => {
    rawAgentMovementStore.getState().tick(delta, isPaused);
  });

  return (
    <group name="agent-group">
      {AGENT_CATALOG.map((config) => {
        const stateRecord = agentStates[config.id];
        const animation = stateRecord ? stateRecord.animation : config.initialAnimation;
        const isSelected = selectedAgentId === config.id;

        return (
          <AgentAvatar
            key={config.id}
            config={config}
            animationState={animation}
            isSelected={isSelected}
            isPaused={isPaused}
            onSelect={selectAgent}
          />
        );
      })}
    </group>
  );
}
