import { describe, expect, it } from 'vitest';
import { AGENT_CATALOG, getAgentById } from './agentCatalog';

describe('AGENT_CATALOG', () => {
  it('contém exatamente os 4 agentes configurados (Gemini, Claude, GPT, Kimi)', () => {
    expect(AGENT_CATALOG.length).toBe(4);

    const ids = AGENT_CATALOG.map((a) => a.id);
    expect(ids).toContain('gemini');
    expect(ids).toContain('claude');
    expect(ids).toContain('gpt');
    expect(ids).toContain('kimi');
  });

  it('possui as cores principais estipuladas na especificação', () => {
    const gemini = getAgentById('gemini');
    const claude = getAgentById('claude');
    const gpt = getAgentById('gpt');
    const kimi = getAgentById('kimi');

    expect(gemini?.appearance.primaryColor).toBe('#6480D8');
    expect(claude?.appearance.primaryColor).toBe('#D48759');
    expect(gpt?.appearance.primaryColor).toBe('#4E9B77');
    expect(kimi?.appearance.primaryColor).toBe('#7D6AC8');
  });

  it('possui as funções corretas para cada agente', () => {
    expect(getAgentById('gemini')?.role).toBe('Product & Coordination');
    expect(getAgentById('claude')?.role).toBe('Research & Documentation');
    expect(getAgentById('gpt')?.role).toBe('Software Engineering');
    expect(getAgentById('kimi')?.role).toBe('Data Analysis');
  });

  it('todos os agentes possuem posições e rotações válidas dentro dos limites do diorama', () => {
    AGENT_CATALOG.forEach((agent) => {
      const [x, y, z] = agent.initialPosition;
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(7.2);
      expect(Math.abs(z)).toBeLessThanOrEqual(5.4);
    });
  });
});
