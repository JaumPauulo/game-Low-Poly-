import { AgentConfig } from '../entities/agents/types';

export const AGENT_CATALOG: AgentConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    role: 'Product & Coordination',
    initialPosition: [3.8, 0, -1.4],
    initialRotationY: Math.PI,
    initialAnimation: 'talking',
    appearance: {
      primaryColor: '#6480D8',
      pantsColor: '#1e293b',
      skinColor: '#fed7aa', // Tom pastel pêssego suave
      hairColor: '#1e293b', // Cabelo escuro clássico
      hairStyle: 'parted',
      accessory: 'idBadge',
      accentColor: '#38bdf8',
    },
  },
  {
    id: 'claude',
    name: 'Claude',
    role: 'Research & Documentation',
    initialPosition: [-2.4, 0, -2.65],
    initialRotationY: 0,
    initialAnimation: 'thinking',
    appearance: {
      primaryColor: '#D48759',
      pantsColor: '#334155',
      skinColor: '#ffedd5',
      hairColor: '#78350f', // Castanho elegante
      hairStyle: 'curly',
      accessory: 'glasses',
      accentColor: '#fbbf24',
    },
  },
  {
    id: 'gpt',
    name: 'GPT',
    role: 'Software Engineering',
    initialPosition: [-4.6, 0, -2.65],
    initialRotationY: 0,
    initialAnimation: 'working',
    appearance: {
      primaryColor: '#4E9B77',
      pantsColor: '#0f172a',
      skinColor: '#fde68a',
      hairColor: '#0f172a',
      hairStyle: 'crop',
      accessory: 'headset',
      accentColor: '#34d399',
    },
  },
  {
    id: 'kimi',
    name: 'Kimi',
    role: 'Data Analysis',
    initialPosition: [-3.2, 0, 1.8],
    initialRotationY: Math.PI / 4,
    initialAnimation: 'coffee',
    appearance: {
      primaryColor: '#7D6AC8',
      pantsColor: '#334155',
      skinColor: '#fed7aa',
      hairColor: '#475569',
      hairStyle: 'sleek',
      accessory: 'none',
      accentColor: '#ec4899',
    },
  },
];

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENT_CATALOG.find((agent) => agent.id === id);
}
