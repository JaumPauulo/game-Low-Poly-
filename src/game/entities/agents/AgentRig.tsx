import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AgentAppearance, AgentRigRefs } from './types';

interface AgentRigProps {
  appearance: AgentAppearance;
  rigRefs: React.MutableRefObject<AgentRigRefs>;
}

export function AgentRig({ appearance, rigRefs }: AgentRigProps) {
  const materials = useMemo(() => {
    return {
      primary: new THREE.MeshStandardMaterial({
        color: appearance.primaryColor,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: appearance.pantsColor,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: appearance.skinColor,
        roughness: 0.75,
        metalness: 0.0,
        flatShading: true,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: appearance.hairColor,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      }),
      eyes: new THREE.MeshBasicMaterial({
        color: '#0f172a',
      }),
      tie: new THREE.MeshStandardMaterial({
        color: appearance.accentColor,
        roughness: 0.7,
      }),
      shoes: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.8,
      }),
      accessory: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.5,
        metalness: 0.2,
      }),
      mug: new THREE.MeshStandardMaterial({
        color: appearance.accentColor,
        roughness: 0.7,
      }),
    };
  }, [appearance]);

  return (
    <group
      name="agent-rig-root"
      ref={(el) => {
        rigRefs.current.root = el;
      }}
    >
      {/* 1. Tronco e Cintura (Centro vertical de animação em Y = 0.52) */}
      <group
        name="agent-torso"
        position={[0, 0.52, 0]}
        ref={(el) => {
          rigRefs.current.torso = el;
        }}
      >
        {/* Tronco estilizado minifig */}
        <mesh castShadow receiveShadow material={materials.primary} position={[0, 0, 0]}>
          <boxGeometry args={[0.38, 0.36, 0.24]} />
        </mesh>

        {/* Gola / Gravata minimalista frontal */}
        <mesh position={[0, 0.06, 0.125]} material={materials.tie}>
          <boxGeometry args={[0.08, 0.18, 0.015]} />
        </mesh>

        {/* Acessório Crachá (se aplicável) */}
        {appearance.accessory === 'idBadge' && (
          <group position={[0.1, 0.04, 0.128]}>
            <mesh material={materials.accessory}>
              <boxGeometry args={[0.07, 0.1, 0.01]} />
            </mesh>
            <mesh position={[0, 0, 0.006]} material={materials.skin}>
              <boxGeometry args={[0.05, 0.07, 0.005]} />
            </mesh>
          </group>
        )}

        {/* 2. Cabeça Grande Chibi (Pivô em Y = 0.32 relativo ao tronco) */}
        <group
          name="agent-head"
          position={[0, 0.32, 0]}
          ref={(el) => {
            rigRefs.current.head = el;
          }}
        >
          {/* Cabeça esférica low-poly estilizada */}
          <mesh castShadow receiveShadow material={materials.skin} position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.24, 16, 12]} />
          </mesh>

          {/* Olhos minimalistas (dois pontinhos geométricos sem realismo) */}
          <mesh position={[-0.08, 0.14, 0.225]} material={materials.eyes}>
            <sphereGeometry args={[0.024, 8, 8]} />
          </mesh>
          <mesh position={[0.08, 0.14, 0.225]} material={materials.eyes}>
            <sphereGeometry args={[0.024, 8, 8]} />
          </mesh>

          {/* Cabelo procedural estilizado de acordo com o hairStyle */}
          <group position={[0, 0.18, 0]}>
            {appearance.hairStyle === 'parted' && (
              <group>
                {/* Calota superior */}
                <mesh position={[0, 0.08, -0.04]} castShadow material={materials.hair}>
                  <boxGeometry args={[0.46, 0.16, 0.44]} />
                </mesh>
                {/* Franja lateral dividida */}
                <mesh position={[-0.1, 0.02, 0.16]} castShadow material={materials.hair}>
                  <boxGeometry args={[0.22, 0.1, 0.12]} />
                </mesh>
              </group>
            )}

            {appearance.hairStyle === 'curly' && (
              <group>
                {/* Volume encaracolado low-poly em blocos */}
                <mesh position={[0, 0.1, -0.03]} castShadow material={materials.hair}>
                  <sphereGeometry args={[0.26, 10, 8]} />
                </mesh>
                <mesh position={[-0.14, 0.08, 0.1]} castShadow material={materials.hair}>
                  <sphereGeometry args={[0.08, 6, 6]} />
                </mesh>
                <mesh position={[0.14, 0.08, 0.1]} castShadow material={materials.hair}>
                  <sphereGeometry args={[0.08, 6, 6]} />
                </mesh>
              </group>
            )}

            {appearance.hairStyle === 'crop' && (
              <mesh position={[0, 0.09, -0.02]} castShadow material={materials.hair}>
                <boxGeometry args={[0.44, 0.14, 0.44]} />
              </mesh>
            )}

            {appearance.hairStyle === 'sleek' && (
              <mesh position={[0, 0.08, -0.04]} castShadow material={materials.hair}>
                <cylinderGeometry args={[0.22, 0.24, 0.18, 12]} />
              </mesh>
            )}
          </group>

          {/* Acessório Óculos (se aplicável) */}
          {appearance.accessory === 'glasses' && (
            <group position={[0, 0.14, 0.23]}>
              <mesh position={[-0.08, 0, 0]} material={materials.accessory}>
                <boxGeometry args={[0.09, 0.06, 0.02]} />
              </mesh>
              <mesh position={[0.08, 0, 0]} material={materials.accessory}>
                <boxGeometry args={[0.09, 0.06, 0.02]} />
              </mesh>
              {/* Ponte central */}
              <mesh position={[0, 0, 0]} material={materials.accessory}>
                <boxGeometry args={[0.06, 0.015, 0.015]} />
              </mesh>
            </group>
          )}

          {/* Acessório Headset (se aplicável) */}
          {appearance.accessory === 'headset' && (
            <group position={[0, 0.14, 0]}>
              {/* Arco superior da cabeça */}
              <mesh position={[0, 0.14, 0]} material={materials.accessory}>
                <boxGeometry args={[0.5, 0.025, 0.05]} />
              </mesh>
              {/* Concha auricular direita */}
              <mesh position={[0.24, 0, 0]} material={materials.accessory}>
                <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
              </mesh>
              {/* Haste do microfone */}
              <mesh position={[0.22, -0.05, 0.1]} rotation={[0.4, 0, 0]} material={materials.accessory}>
                <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
              </mesh>
            </group>
          )}
        </group>

        {/* 3. Braço Esquerdo (Pivô do Ombro em X = -0.24, Y = 0.12) */}
        <group
          name="agent-left-arm"
          position={[-0.24, 0.12, 0]}
          ref={(el) => {
            rigRefs.current.leftArm = el;
          }}
        >
          {/* Braço curto */}
          <mesh castShadow material={materials.primary} position={[0, -0.12, 0]}>
            <boxGeometry args={[0.1, 0.24, 0.1]} />
          </mesh>
          {/* Mãozinha esférica simples */}
          <group
            position={[0, -0.26, 0]}
            ref={(el) => {
              rigRefs.current.leftHand = el;
            }}
          >
            <mesh castShadow material={materials.skin}>
              <sphereGeometry args={[0.05, 8, 8]} />
            </mesh>
          </group>
        </group>

        {/* 4. Braço Direito (Pivô do Ombro em X = 0.24, Y = 0.12) */}
        <group
          name="agent-right-arm"
          position={[0.24, 0.12, 0]}
          ref={(el) => {
            rigRefs.current.rightArm = el;
          }}
        >
          {/* Braço curto */}
          <mesh castShadow material={materials.primary} position={[0, -0.12, 0]}>
            <boxGeometry args={[0.1, 0.24, 0.1]} />
          </mesh>
          {/* Mãozinha esférica simples */}
          <group
            position={[0, -0.26, 0]}
            ref={(el) => {
              rigRefs.current.rightHand = el;
            }}
          >
            <mesh castShadow material={materials.skin}>
              <sphereGeometry args={[0.05, 8, 8]} />
            </mesh>
          </group>

          {/* Caneca de Café procedural na mão direita (invisível por padrão até animação 'coffee') */}
          <group
            name="agent-mug"
            position={[0, -0.26, 0.06]}
            scale={[0, 0, 0]}
            ref={(el) => {
              rigRefs.current.mug = el;
            }}
          >
            <mesh castShadow material={materials.mug}>
              <cylinderGeometry args={[0.04, 0.035, 0.08, 8]} />
            </mesh>
            {/* Alça da caneca */}
            <mesh position={[0.045, 0, 0]} material={materials.mug}>
              <boxGeometry args={[0.02, 0.05, 0.02]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 5. Perna Esquerda (Pivô da coxa em X = -0.1, Y = 0.32) */}
      <group
        name="agent-left-leg"
        position={[-0.1, 0.32, 0]}
        ref={(el) => {
          rigRefs.current.leftLeg = el;
        }}
      >
        <mesh castShadow material={materials.pants} position={[0, -0.14, 0]}>
          <boxGeometry args={[0.12, 0.28, 0.14]} />
        </mesh>
        {/* Sapato */}
        <mesh castShadow material={materials.shoes} position={[0, -0.3, 0.02]}>
          <boxGeometry args={[0.13, 0.06, 0.18]} />
        </mesh>
      </group>

      {/* 6. Perna Direita (Pivô da coxa em X = 0.1, Y = 0.32) */}
      <group
        name="agent-right-leg"
        position={[0.1, 0.32, 0]}
        ref={(el) => {
          rigRefs.current.rightLeg = el;
        }}
      >
        <mesh castShadow material={materials.pants} position={[0, -0.14, 0]}>
          <boxGeometry args={[0.12, 0.28, 0.14]} />
        </mesh>
        {/* Sapato */}
        <mesh castShadow material={materials.shoes} position={[0, -0.3, 0.02]}>
          <boxGeometry args={[0.13, 0.06, 0.18]} />
        </mesh>
      </group>
    </group>
  );
}
