# ROADMAP.md — Agent Office Diorama

Este documento registra o planejamento das etapas de desenvolvimento do **Agent Office Diorama**, servindo como fonte da verdade para o progresso do projeto.

---

## Estado Atual do Projeto

- **Fase Ativa:** Fase 4 — Entidades e Personagens Procedurais
- **Última Tarefa Concluída:** TASK-009 (Personagens procedurais chibi/minifig, rig esquelético, catálogo e 7 animações)
- **Próxima Tarefa:** Fase 2 — Simulação Lógica Pura e Máquina de Estados (State Machine)

---

## Fases de Desenvolvimento

### Fase 0: Fundação do Projeto
- [x] **TASK-000: Fundação documental**
  - Criação dos documentos norteadores: `GAME_SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md` e `CHANGELOG.md`.
  - Formalização dos requisitos de gameplay, direção visual 3D, stack tecnológica e diretrizes arquiteturais.
  - Sincronização dos metadados da aplicação (`metadata.json` e `index.html`).
  - Verificação e preservação da integridade de compilação da base existente.

---

### Fase 1: Setup do Ecossistema 3D e Estado Global
- [x] **TASK-001: Instalação e configuração da fundação técnica 3D**
  - Instalação e configuração de `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `zustand` e `vitest`.
  - Estruturação modular com `GameShell`, `GameCanvas`, `TestScene`, `GameErrorBoundary`, `LoadingFallback`, `WebGLFallback` e `UIOverlay`.
  - Configuração do pipeline gráfico: sRGB (`SRGBColorSpace`), sombras suaves (`PCFSoftShadowMap`), antialias, limite de DPR `[1, 1.5]` e fundo sólido.
  - Cena de teste com plano receptor de sombra, iluminação suave e cubo low poly procedural girando via ref (sem setState em useFrame).
  - Tratamento de erro com fallback para falha de WebGL e Error Boundary para o ciclo de renderização.
- [ ] **TASK-002: Estrutura inicial de diretórios e store Zustand**
  - Criação dos diretórios modulares sob `src/game/`, `src/ui/`, `src/store/`.
  - Definição dos tipos centrais do simulador em `src/game/types.ts`.
  - Criação da store inicial `useGameStore.ts`.

---

### Fase 2: Motor Matemático e Simulação Pura (TypeScript Puro)
- [ ] **TASK-003: Fundamentos determinísticos e PRNG**
  - Implementação do gerador determinístico pseudoaleatório baseado em seed (`prng.ts`).
  - Implementação do gerenciador de fixed timestep (`timeStep.ts`).
  - Testes unitários com Vitest validando determinismo e reprodutibilidade.
- [ ] **TASK-004: Grid de navegação e algoritmo A\***
  - Representação matricial do espaço transitável e obstáculos (`grid.ts`).
  - Implementação pura do algoritmo de busca de caminho A* (`astar.ts`).
  - Cobertura de testes unitários para trajetórias válidas, cantos e alvos inalcançáveis.
- [ ] **TASK-005: Máquina de estados (FSM) e economia dos agentes**
  - Definição dos estados comportamentais (`IDLE`, `NAVIGATING`, `WORKING`, `COLLABORATING`, `RESTING`).
  - Lógica de variação e limites de Energia, Foco, Moral e Produtividade.
  - Regras de ocupação exclusiva e coletiva de postos (`occupancy.ts`).
  - Gerenciamento de tarefas e progresso de trabalho (`taskManager.ts`).
  - Testes unitários de transições de estado e invariantes numéricos.

---

### Fase 3: Cena 3D, Câmera Ortográfica e Diorama Base
- [x] **TASK-006: Canvas 3D e Câmera Ortográfica Isométrica**
  - Criação da cena com `OrthographicCamera` em ângulo 3/4 isométrico sem distorção angular de perspectiva.
- [x] **TASK-007: Iluminação suave e pedestal do diorama**
  - Iluminação suave e difusa (ambient light + hemisphere light + directional light com sombras suaves PCFSoftShadowMap).
  - Modelagem procedural da base flutuante recortada com pedestal, piso claro e paredes em corte (cutaway).

---

### Fase 4: Entidades e Mobiliário Procedural Low-Poly
- [x] **TASK-008: Mobiliário de escritório data-driven**
  - Construção procedural das 4 estações de trabalho (mesas, monitores, laptops, cadeiras ergonômicas).
  - Construção procedural da mesa de reunião para 4 pessoas e cadeiras de conferência.
  - Construção da área de café (balcão, cafeteira express, canecas, mesa bistrô e banquetas).
  - Construção da área de convivência/lounge (sofá de 3 lugares, almofadas, mesinha de centro, luminária e tapete).
  - Plantas ornamentais low-poly em vasos geométricos.
  - Carregamento de mobiliário e zonas 100% data-driven via `officeLayout.ts`.
- [x] **TASK-009: Agente Chibi/Minifig procedural**
  - Construção procedural do modelo chibi utilizando geometrias nativas (cabeça grande, tronco simplificado, braços e pernas curtos, mãos esféricas simples, caneca procedural).
  - Variações visuais estilizadas para os 4 agentes (Gemini, Claude, GPT, Kimi) com cores principais, penteados e acessórios em paleta pastel fosca.
  - Rig procedural com referências de esqueleto (`AgentRigRefs`) e 7 animações procedurais matemáticas (`idle`, `walking`, `working`, `thinking`, `talking`, `coffee`, `error`).
  - Marcador de chão (`AgentGroundMarker`) e identificador acima da cabeça (`AgentNameplate`).
  - Catálogo de agentes data-driven (`agentCatalog.ts`) e store Zustand para teste de animações e seleção.

---

### Fase 5: Conexão Simulação-Render e Animação Procedural
- [ ] **TASK-010: Sincronizador de simulação e interpolação de movimento**
  - Conexão do loop de tick da simulação com a renderização via `useSimulationSync.ts`.
  - Interpolação suave de posição (`lerp`) e rotação nos meshes dos agentes sem mutação de estado React por frame.
- [ ] **TASK-011: Animações procedurais e feedback de estado**
  - Bobbing suave de caminhada e postura sentada durante o trabalho.
  - Indicadores visuais sutis de status do agente (balões de pensamento, ícones de foco/fadiga).

---

### Fase 6: Interface do Usuário e Controles
- [ ] **TASK-012: Painel de controle da simulação**
  - Controles de reprodução (Play, Pause, Velocidades 1x, 2x, 4x).
  - Indicador de tempo simulado e métricas globais de produtividade do escritório.
- [ ] **TASK-013: Painel de inspeção de agentes e backlog de tarefas**
  - Seleção de agentes por clique ou lista para inspeção detalhada de atributos vitais.
  - Visualização e atribuição do backlog de tarefas da equipe.
  - Layout responsivo: sidebar em desktop e drawer/bottom-sheet em dispositivos móveis.

---

### Fase 7: Polimento, Acessibilidade e Performance
- [ ] **TASK-014: Otimização de renderização e auditoria de performance**
  - Verificação de garbage collection zero em loops de render.
  - Reutilização estrita de geometrias e materiais.
  - Garantia de 60 FPS em resoluções mobile e desktop.
- [ ] **TASK-015: Acessibilidade e suporte completo a controles**
  - Navegação por teclado, foco visível e rótulos acessíveis (WCAG AA).
  - Suporte completo a gestos touch (pinch-to-zoom e rotação por toque).

---

### Fase 8 (Opcional / Futura): Integração Server-Side com Gemini AI
- [ ] **TASK-016: Rotas seguras de backend e diálogos contextuais**
  - Endpoint Express em `/api/agent-dialogue` utilizando `@google/genai`.
  - Geração de pequenos diálogos e resumos temáticos opcionais sem alterar a independência da simulação local.
