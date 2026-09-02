import * as THREE from 'three';

export type AgentId = 'gemini' | 'claude' | 'gpt' | 'kimi' | string;

export type AgentAnimationState =
  | 'idle'
  | 'walking'
  | 'working'
  | 'thinking'
  | 'talking'
  | 'coffee'
  | 'error';

export type HairStyle = 'parted' | 'curly' | 'crop' | 'sleek';
export type AccessoryType = 'none' | 'glasses' | 'headset' | 'idBadge';

export interface AgentAppearance {
  primaryColor: string; // Cor do casaco/camisa principal
  pantsColor: string; // Cor da calça
  skinColor: string; // Tom suave estilizado de pele
  hairColor: string; // Cor do cabelo
  hairStyle: HairStyle;
  accessory: AccessoryType;
  accentColor: string; // Cor de detalhe/sapato/gadget
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  initialPosition: [number, number, number];
  initialRotationY: number;
  initialAnimation: AgentAnimationState;
  appearance: AgentAppearance;
}

export interface AgentRigRefs {
  root: THREE.Group | null;
  torso: THREE.Group | null;
  head: THREE.Group | null;
  leftArm: THREE.Group | null;
  rightArm: THREE.Group | null;
  leftLeg: THREE.Group | null;
  rightLeg: THREE.Group | null;
  leftHand: THREE.Group | null;
  rightHand: THREE.Group | null;
  mug: THREE.Group | null;
}
