import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { updateAgentRigAnimation } from './animations';
import { AgentGroundMarker } from './AgentGroundMarker';
import { rawAgentMovementStore } from './agentMovementStore';
import { AgentNameplate } from './AgentNameplate';
import { AgentRig } from './AgentRig';
import { AgentAnimationState, AgentConfig, AgentRigRefs } from './types';

interface AgentAvatarProps {
  config: AgentConfig;
  animationState?: AgentAnimationState;
  isSelected?: boolean;
  isPaused?: boolean;
  onSelect?: (id: string) => void;
}

export function AgentAvatar({
  config,
  animationState,
  isSelected = false,
  isPaused = false,
  onSelect,
}: AgentAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const activeAnimation = animationState ?? config.initialAnimation;
  const rootGroupRef = useRef<THREE.Group>(null);

  // Refs de peças do esqueleto para cinemática procedural sem alocação
  const rigRefs = useRef<AgentRigRefs>({
    root: null,
    torso: null,
    head: null,
    leftArm: null,
    rightArm: null,
    leftLeg: null,
    rightLeg: null,
    leftHand: null,
    rightHand: null,
    mug: null,
  });

  // Checagem de prefers-reduced-motion para acessibilidade e performance
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionRef.current = mediaQuery.matches;

      const listener = (event: MediaQueryListEvent) => {
        reducedMotionRef.current = event.matches;
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Tempo acumulado contínuo imune a pausas
  const accumulatedTimeRef = useRef(0);

  useFrame((_, delta) => {
    // Sincroniza posição contínua e orientação do avatar sem renderizar novamente a árvore React
    const movement = rawAgentMovementStore.getState().movements[config.id];
    if (movement && rootGroupRef.current) {
      rootGroupRef.current.position.x = movement.currentWorldPos.x;
      rootGroupRef.current.position.z = movement.currentWorldPos.z;
      rootGroupRef.current.rotation.y = movement.rotationY;
    }

    if (isPaused) {
      return;
    }

    // Acumula tempo somente quando não pausado
    accumulatedTimeRef.current += delta;

    updateAgentRigAnimation(
      rigRefs.current,
      activeAnimation,
      accumulatedTimeRef.current,
      reducedMotionRef.current
    );
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(config.id);
    }
  };

  return (
    <group
      ref={rootGroupRef}
      name={`agent-${config.id}`}
      position={config.initialPosition}
      rotation={[0, config.initialRotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'default';
        }
      }}
    >
      {/* Marcador circular no chão sob o agente */}
      <AgentGroundMarker
        color={config.appearance.primaryColor}
        isSelected={isSelected}
        isHovered={isHovered}
      />

      {/* Rig procedural do personagem chibi/minifig */}
      <AgentRig appearance={config.appearance} rigRefs={rigRefs} />

      {/* Placa com nome e função acima da cabeça */}
      <AgentNameplate
        name={config.name}
        role={config.role}
        primaryColor={config.appearance.primaryColor}
        isSelected={isSelected}
        isHovered={isHovered}
      />
    </group>
  );
}
