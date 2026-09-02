# CHANGELOG.md — Agent Office Diorama

Todas as modificações relevantes e marcos técnicos deste projeto são documentados neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.8.0] - 2026-09-02

### Adicionado
- **Integração do Motor de Simulação à Navegação e Representação 3D (TASK-010 / TASK-011 / TASK-012)**:
  - **Zonas e Pontos de Interação Configuráveis (`src/game/config/officeZones.ts`)**:
    - Definição das 6 zonas exigidas pela especificação: `workstations`, `coffee`, `meeting`, `lounge`, `spawn` e `walkable`.
    - Cada zona possui pontos de interação com coordenadas discretas de grid e contínuas no mundo 3D rigorosamente alinhadas com as células transitáveis do grid de navegação.
    - Prevenção de sobreposição: função pura `getAvailableInteractionPoint` que respeita ocupação de outros agentes e mesas atribuídas aos respectivos avatares.
    - Testes unitários com Vitest em `officeZones.test.ts`.
  - **Cenário Inicial e Fila de Tarefas (`src/game/simulation/initialScenario.ts`)**:
    - 6 tarefas cobrindo os tipos solicitados: `coding` (2x: arquitetura do sistema e sincronização de estado), `research` (pesquisa de heurísticas A*), `analysis` (otimização de render e draw calls), `planning` (planejamento da iteração) e `documentation` (redação do manual do simulador).
    - Configuração de dependências encadeadas entre tarefas respeitando a lógica de desbloqueio.
    - Inicialização dos 4 agentes com habilidades e estados prontos para execução autônoma.
    - Testes unitários com Vitest em `initialScenario.test.ts`.
  - **Store e Controlador de Ciclo de Vida (`src/game/simulation/simulationStore.ts`)**:
    - Gerenciamento reativo do estado da simulação com Zustand vanilla sem dependência de Three.js.
    - Controles de execução: Play, Pause, velocidades 1x, 2x, 4x e Reset completo do cenário determinístico.
    - Fila de eventos históricos de telemetria com limite seguro de memória (50 itens).
  - **Ponte de Integração da Simulação (`src/game/systems/simulationBridge.ts`)**:
    - Ponte desacoplada entre a lógica pura e a renderização Three.js.
    - Mapeamento estrito dos 9 estados para animações:
      - `idle` -> `idle`
      - `planning` -> `thinking`
      - `walking` -> `walking` (trajeto pelo A*)
      - `working` -> `working` (estação de trabalho)
      - `thinking` -> `thinking`
      - `collaborating` -> `talking` (sala de reunião)
      - `coffee` -> `coffee` (área de café)
      - `talking` -> `talking`
      - `error` -> `idle` (com indicador visual discreto)
    - Interpretação de comandos emitidos pela simulação (`MOVE_TO_ZONE`) acionando o `AgentMovementStore` para navegação cinemática.
    - Atualização da zona do agente e transição de estado da simulação estritamente após a chegada física ao destino.
    - Testes unitários com Vitest em `simulationBridge.test.ts`.
  - **Atualização Visual de Avatares e Nameplates (`AgentAvatar.tsx`, `AgentNameplate.tsx`)**:
    - Adicionado suporte a indicador de erro visual `hasError` em avatares e placas de identificação sobre a cabeça.
    - Otimização do loop `useFrame` em `AgentGroup.tsx`: o `simulationBridge.update(delta)` orquestra o avanço lógico e a cinemática sem acionar `setState` por frame.
  - **Painéis de Controle, Feed de Eventos e Acompanhamento de Tarefas (`src/ui/panels/`)**:
    - `SimulationControls.tsx`: Barra de reprodução com botões de pausa, play, velocidades (1x, 2x, 4x), reset e cronômetro de tempo de simulação.
    - `EventFeedPanel.tsx`: Feed de eventos em tempo real com ícones para cada categoria de evento (atribuição, início, conclusão, café, colaboração e alertas).
    - `TaskBoardPanel.tsx`: Quadro de acompanhamento de tarefas exibindo progresso, status, dependências e agente alocado.
    - Integração de botões de alternância e gavetas no `UIOverlay.tsx`.

---

## [0.7.0] - 2026-09-02

### Adicionado
- **Motor Lógico e Determinístico da Simulação (TASK-003 / TASK-005)**:
  - **Módulo de Tipos e Contratos Estritos (`src/game/simulation/types.ts`)**:
    - Definição formal das interfaces `AgentSimulationModel`, `TaskModel`, `SimulationConfig`, `SimulationState`, `SimulationCommand` e `SimulationEvent`.
    - Suporte a 9 estados comportamentais: `idle`, `planning`, `walking`, `working`, `thinking`, `collaborating`, `coffee`, `talking` e `error`.
    - Suporte a 5 tipos de habilidades com afinidades `[0, 1]`: `coding`, `research`, `analysis`, `planning` e `documentation`.
    - Suporte a 6 status de tarefas: `backlog`, `assigned`, `in_progress`, `blocked`, `completed` e `cancelled`.
  - **PRNG Pseudoaleatório com Seed (`src/game/simulation/prng.ts`)**:
    - Implementação determinística baseada no algoritmo Mulberry32 com interface `RandomSource` (`next`, `nextInt`, `nextFloat`, `clone`).
    - Nenhuma chamada a `Date.now` ou `Math.random` em todo o código da simulação.
    - Testes unitários com Vitest em `prng.test.ts`.
  - **Fórmulas Puras de Produtividade, Fadiga e Recuperação (`src/game/simulation/productivity.ts`)**:
    - Função pura `calculateTaskProductivity` integrando multiplicador de afinidade por skill, fator inverso de complexidade (1 a 5), fator de energia (com decaimento quadrático abaixo de 20%), fator de foco e bônus limitado de colaboração (máximo 25%).
    - Invariantes rigorosos: progresso monotônico crescente no intervalo `[0, 1]`, energia e foco estritamente limitados a `[0, 1]`.
    - Funções de consumo em trabalho ativo (`applyWorkingDrain`) e recarga no café (`applyCoffeeRecovery`).
    - Testes unitários com Vitest em `productivity.test.ts`.
  - **Regras Locais de Decisão e Resolução de Dependências (`src/game/simulation/decision.ts`)**:
    - Validação de integridade defensiva (`validateAgentIntegrity`) que isola dados corrompidos no estado `error` sem travar a simulação.
    - Verificação e desbloqueio de dependências de tarefas (`updateTaskDependencies`).
    - Seleção determinística de tarefas prioritárias por afinidade e ID (`selectBestEligibleTask`).
    - Recrutamento dinâmico de colaborador para tarefas de alta complexidade (`findAvailableCollaborator`).
  - **Função Central de Simulação (`src/game/simulation/simulationStep.ts`)**:
    - Assinatura estrita: `simulationStep(previousState, deltaSeconds, randomSource) => { nextState, events, commands }`.
    - Timestep fixo padrão de 250 ms e suporte a escalas de velocidade (1x, 2x, 4x) e pausa sem mutação de estado.
    - Emissão de comandos desacoplados: `MOVE_TO_ZONE`, `START_WORK`, `START_COFFEE_BREAK`, `START_COLLABORATION`, `EMIT_MESSAGE`.
    - Emissão de eventos históricos para telemetria: `AGENT_STATE_CHANGED`, `TASK_ASSIGNED`, `TASK_STARTED`, `TASK_PROGRESS`, `TASK_COMPLETED`, `TASK_BLOCKED`, `COFFEE_BREAK_STARTED`, `COFFEE_BREAK_ENDED`, `COLLABORATION_STARTED`, `COLLABORATION_ENDED`, `AGENT_ERROR`.
    - Testes unitários cobrindo todos os 14 critérios mandatórios em `simulationStep.test.ts` (91 testes no total do projeto, 100% aprovados).
  - **Documentação Formal do Modelo (`SIMULATION_MODEL.md`)**:
    - Especificação de estados, diagrama de transições, formulação matemática detalhada, invariantes, eventos e comandos.

---

## [0.6.0] - 2026-09-02

### Adicionado
- **Conexão dos Personagens ao Sistema de Navegação, Movimentação e Ocupação (TASK-004B)**:
  - **Gerenciador de Ocupação e Reservas (`src/game/navigation/occupancy.ts`)**:
    - Módulo puro TypeScript (`OccupancyManager`) responsável por rastrear qual agente ocupa qual célula do grid (`Map<string, GridCoordinate>`) e quais células estão reservadas para o próximo passo (`Map<string, string>`).
    - Garantia estrita de que dois agentes nunca ocupam a mesma célula nem reservam a mesma célula simultaneamente.
    - Método `getDynamicObstacles` que expõe os outros agentes como obstáculos dinâmicos para desvios no A*.
    - Cobertura com testes unitários no Vitest em `occupancy.test.ts`.
  - **Cinemática de Movimentação e Rotação Suave (`src/game/navigation/movement.ts`)**:
    - Função pura `stepAgentMovement` calculando avanço em unidades por segundo independente de frame rate (`delta` time).
    - Rotação suave orientada na direção do movimento (`lerpAngle`) calculada por `Math.atan2(dx, dz)`.
    - Lógica de reserva de célula antes de iniciar a travessia para o próximo waypoint do caminho.
    - Se a célula seguinte estiver temporariamente bloqueada por outro agente, o agente aguarda no estado `waiting` e, caso persista bloqueada além de tolerância configurável (1.2s), recalcula dinamicamente uma nova rota pelo A*.
    - Cobertura com testes unitários no Vitest em `movement.test.ts`.
  - **Store de Movimentação dos Agentes (`src/game/entities/agents/agentMovementStore.ts`)**:
    - Ponte reativa desacoplada entre a lógica pura e a renderização, contendo posições lógicas e métricas dos 4 agentes.
    - Ações `commandAgentMove`, `stopAgent`, `tick` e `resetAllMovements`.
    - Atualização automática da animação do agente para `walking` durante o trânsito e retorno a `idle` ao chegar ao destino ou parar.
    - Feedback discreto com mensagens informativas sem disparar erros (ex: destino em obstáculo, fora do grid ou bloqueado).
    - Testes unitários com Vitest em `agentMovementStore.test.ts`.
  - **Integração Visual com Three.js e React**:
    - `AgentAvatar.tsx`: Atualiza posição contínua e rotação Y do modelo procedural diretamente via `rootGroupRef` no `useFrame`, sem disparar `setState` ou renderizações React por frame.
    - `AgentGroup.tsx`: Atua como orquestrador único executando o `tick` de simulação de movimento em cada frame.
    - `DioramaBase.tsx`: Suporte a clique e toque na malha superior do piso com captura de coordenadas do ponto world (`e.point.x`, `e.point.z`), disparando o movimento do agente selecionado e invocando `e.stopPropagation()`.
    - `GameCanvas.tsx`: Handler `onPointerMissed` no `<Canvas>` para desselecionar qualquer agente ao clicar no fundo vazio fora do diorama.
    - `DestinationMarker.tsx`: Marcador 3D discreto no piso (anel pulsante e cone estilizado) na cor do agente selecionado durante o deslocamento.
    - `NavigationDebugOverlay.tsx`: Renderização do trajeto ativo em tempo real do agente selecionado quando o modo debug está ligado.
    - `UIOverlay.tsx`: Indicadores de status da movimentação, coordenadas do destino, botão "Parar" e toast de feedback discreto.

---

## [0.5.0] - 2026-09-02

### Adicionado
- **Sistema Matemático de Navegação e Pathfinding A\* (TASK-004)**:
  - Implementado módulo estritamente desacoplado em `src/game/navigation/` sem dependência de React ou Three.js (TypeScript puro).
  - Tipos explícitos: `GridCoordinate`, `WorldCoordinate2D`, `NavigationGrid`, `NavigationCell`, `PathResult`, `NavigationObstacle`, `AStarOptions` e `PathFailureReason`.
  - Funções matemáticas puras em `gridUtils.ts`:
    - `gridToWorld`: conversão considerando o centro do escritório como origem `worldX = (gridX - (cols - 1) / 2) * cellSize`.
    - `worldToGrid`: conversão inversa com arredondamento e validação de limites.
    - `isInsideGrid`: verificação estrita de limites do grid.
    - `isWalkable`: consulta de navegabilidade considerando obstáculos estáticos e dinâmicos opcionais.
    - `clampGridCoordinate`: contenção segura dentro dos limites.
    - `getNeighbors`: retorno de até 8 vizinhos com custo 1 (ortogonais) e $\sqrt{2}$ (diagonais), impedindo travessia diagonal se qualquer uma das células ortogonais adjacentes estiver bloqueada (anti-corner cutting).
    - `createNavigationGrid` e `createObstaclesFromConfig`: construção do grid a partir do `OFFICE_LAYOUT_CONFIG` oficial.
  - Algoritmo A\* puro em `astar.ts`:
    - Heurística octile para distância admissível e consistente em 8 direções.
    - Reconstrução completa do caminho discreto (`path: GridCoordinate[]`) e métrico (`worldPath: WorldCoordinate2D[]`).
    - Tratamento explícito de casos de borda: origem igual ao destino, destino fora dos limites (`OUT_OF_BOUNDS`), destino bloqueado por obstáculo (`GOAL_INVALID`), destino inalcançável murado (`UNREACHABLE`), e limite configurável de iterações (`MAX_ITERATIONS_EXCEEDED`).
    - Opção `allowDestinationObstacle` para permitir traçar rota até a borda de interação de mesas e postos de trabalho.
  - Suíte de 13 testes unitários com Vitest em `astar.test.ts` cobrindo rigorosamente todos os 10 critérios de teste especificados.
  - Modo visual de depuração de navegação (desativado por padrão):
    - Componente Three.js `NavigationDebugOverlay.tsx` em `src/game/scene/navigation/` exibindo células navegáveis (verde sutil), obstáculos (vermelho sutil), marcador de origem (coluna esmeralda), marcador de destino (coluna violeta) e caminho traçado em linha conectando waypoints.
    - Store Zustand dedicado `navigationDebugStore.ts`.
    - Botão "Debug Grid" e painel interativo com presets de teste adicionados no `UIOverlay.tsx`.

---

## [0.4.3] - 2026-09-02

### Corrigido
- **Centralização, enquadramento e perspectiva isométrica da câmera 3D**:
  - Resolvido o problema em que o diorama do escritório aparecia pequeno, cortado e deslocado para o canto inferior esquerdo com projeção horizontal plana. A câmera ortográfica anterior utilizava posição `[15, 15, 15]` sem invocar `camera.lookAt()`, mantendo sua rotação padrão `Euler(0, 0, 0)` orientada para o eixo `-Z`, o que empurrava o centro do mundo `(0, 0, 0)` 15 unidades para a esquerda e para baixo na tela sem aplicar a rotação angular isométrica de 45°/35.26°.
  - Criado o componente modular `IsometricCamera.tsx` em conformidade estrita com `ARCHITECTURE.md` e os requisitos de câmera:
    - Orientação rigorosa via `camera.lookAt([0, 1.2, 0])` e `camera.updateMatrixWorld(true)` garantindo que o centro do escritório permaneça rigorosamente em `(0, 0)` no espaço de tela.
    - Suporte a rotações exatas em incrementos de 90 graus (45° SE, 135° SW, 225° NW e 315° NE) com transição angular suave via `useFrame` utilizando referências mutáveis (sem disparar `setState` ou alocações de vetores no loop).
    - Cálculo de zoom responsivo em `calculateResponsiveZoom(width, height)` que adapta o tamanho do diorama para preencher ~75% da viewport com margens elegantes em qualquer resolução (Full HD, ultrawide, notebooks e mobile portrait).
  - Criado `cameraStore.ts` com Zustand puro e `useSyncExternalStore` para controlar índices de rotação (0..3) e zoom do usuário.
  - Adicionados controles de câmera na interface (`UIOverlay.tsx`): botões de girar 90° para esquerda/direita, indicador de orientação, zoom in/out e restauração de enquadramento original.
  - Adicionado suporte a zoom com a roda do mouse (`onWheel`) em `GameCanvas.tsx`.
  - Adicionada suíte de testes unitários para `cameraUtils.test.ts` e `cameraStore.test.ts` (41 testes passando com 100% de cobertura).

---

## [0.4.2] - 2026-09-02

### Corrigido
- **Escala de `AgentNameplate` e normalização da visualização 3D**:
  - Resolvido o problema em que a tela exibia apenas formas gigantes azul-escuras e letras imensas. O componente `<Html>` do `@react-three/drei` com `distanceFactor={18}` em conjunto com uma `OrthographicCamera` (`camera.zoom: 36`) multiplicava o tamanho dos elementos CSS por `36 * 18 = 648x`, fazendo com que a placa de identificação estilizada em `bg-slate-900` se expandisse por dezenas de milhares de pixels cobrindo todo o diorama.
  - Removido `distanceFactor` para utilizar escala 1:1 estritamente em pixels no espaço de tela, mantendo tipografia e marcadores perfeitamente nítidos e proporcionais acima da cabeça dos agentes.
  - Configurado `zIndexRange={[5, 0]}` no `<Html>` para garantir que placas flutuantes nunca se sobreponham aos painéis da interface (`z-10`).
  - Inicialização de `selectedAgentId: null` na store para apresentar o diorama limpo e focado no cenário e personagens na carga inicial, destacando placas apenas sob seleção ou hover interativo.

---

## [0.4.1] - 2026-09-02

### Corrigido
- **Resolução de hooks React em `UIOverlay` e `agentStore`**:
  - Resolvido o erro `Invalid hook call: Cannot read properties of null (reading 'useCallback')` causado pela duplicação de instâncias internas de React entre Zustand (`node_modules/zustand/esm/react.mjs`) e React 19 no bundler Vite.
  - Adicionada configuração explícita de `resolve.dedupe: ['react', 'react-dom', 'zustand', 'three']` no `vite.config.ts` para garantir instância única do React em todo o ecossistema e subdependências (R3F, Drei, Zustand).
  - Refatorado `src/game/entities/agents/agentStore.ts` para utilizar `createStore` de `zustand/vanilla` associado a `useSyncExternalStore` nativo diretamente do pacote `'react'`, eliminando qualquer camada intermediária propensa a descompasso de dispatcher.
  - Otimizado `AgentAvatar.tsx` para passar a tupla `position={config.initialPosition}` diretamente sem alocar instâncias de `Vector3` no JSX.
  - Adicionado teste de unidade em `agentStore.test.ts` (27 testes passando no total).

---

## [0.4.0] - 2026-09-02

### Corrigido
- **Detecção de aceleração WebGL (`src/utils/webgl.ts`)**: Corrigida a validação que exigia estritamente `gl instanceof WebGLRenderingContext`. Em ambientes e navegadores modernos que retornam `WebGL2RenderingContext` (ou instâncias em iframes), a verificação agora valida adequadamente a existência do contexto e da função `getParameter`, eliminando a exibição incorreta da tela de fallback de WebGL ausente relatada no teste de deploy.

### Adicionado
- **Personagens procedurais chibi/minifig (TASK-009)**:
  - Criação dos 4 agentes autônomos configuráveis e visualmente distintos:
    - **Gemini**: Product & Coordination (`#6480D8`), cabelo repartido, crachá funcional, posicionado na mesa de conferência.
    - **Claude**: Research & Documentation (`#D48759`), cabelo castanho cacheado, óculos finos, posicionado na estação de pesquisa.
    - **GPT**: Software Engineering (`#4E9B77`), cabelo escuro curto, headset de comunicação, posicionado na estação de desenvolvimento.
    - **Kimi**: Data Analysis (`#7D6AC8`), corte liso contemporâneo, posicionado na área de café com caneca.
  - Modelagem procedural 100% em primitivas Three.js (sem assets externos, texturas fotográficas ou rostos realistas):
    - Cabeça grande estilizada (raio ~0.24) com olhos mínimos geométricos e variações procedurais de corte de cabelo e acessórios.
    - Tronco simplificado minifig em proporções chibi (0.38 x 0.36 x 0.24), gola/gravata e calças escuras em materiais foscos.
    - Braços curtos com mãos esféricas simples e caneca de café procedural anexada.
  - **Arquitetura modular de agentes**:
    - `AgentRig`: Anatomia procedural com pontos de articulação e referências de esqueleto (`AgentRigRefs`).
    - `AgentAvatar`: Orquestrador visual com cinemática contínua, zero alocações por frame no `useFrame` e suporte a `prefers-reduced-motion`.
    - `AgentNameplate`: Identificador textual flutuante nítido com nome e função.
    - `AgentGroundMarker`: Marcador circular no piso refletindo estados de seleção e hover.
    - `AGENT_CATALOG`: Catálogo data-driven extensível para adicionar novos agentes sem duplicar componentes.
    - `useAgentStore`: Store Zustand com seleção ativa, pausa da simulação e chaveamento de animações.
  - **7 Animações procedurais matemáticas puras**:
    - `idle`: Respiração sutil no eixo Y e leve oscilação harmônica.
    - `walking`: Alternância rítmica de pernas e braços em oposição de fase.
    - `working`: Digitação rápida com mãos alternadas e cabeça orientada para o monitor.
    - `thinking`: Mão direita próxima ao queixo com inclinação curiosa da cabeça.
    - `talking`: Gestos articulados de diálogo e acenos afirmativos.
    - `coffee`: Caneca erguida ciclicamente até a boca com degustação.
    - `error`: Sobressalto rápido (shake harmônico) com braços levantados.
  - Painel de teste e seleção integrado ao `UIOverlay`.
  - Suíte de testes unitários com Vitest em `animations.test.ts` e `agentCatalog.test.ts` (21 testes passando no total).

---

## [0.3.0] - 2026-09-02

### Adicionado
- **Cenário procedural do escritório e mobiliário data-driven**
  - Definição da geometria em grid de 12x9 células com 1.2 unidades de tamanho (dimensões totais de 14.4 x 10.8 unidades no mundo 3D).
  - Configuração data-driven estritamente tipada em `src/game/config/officeLayout.ts` com zonas lógicas, posições de mobiliário, rotações e bounding boxes para navegação.
  - Componentes procedurais reutilizáveis com primitivas Three.js puras (sem modelos GLB, sem texturas externas):
    - `DioramaBase`: Base flutuante com altura ~0.45, pedestal chanfrado e piso claro com divisões funcionais discretas.
    - `CutawayWalls`: Paredes Norte e Oeste (altura ~3.5, espessura ~0.25) com acabamento fosco, rodapés, whiteboard com moldura de alumínio e marcadores coloridos, e painéis acústicos estilizados.
    - `LowPolyDesk`: Mesas com acabamento carvalho escandinavo, estrutura metálica em grafite, gaveteiro embutido e divisória acústica de feltro colorido.
    - `LowPolyChair`: Cadeiras de escritório ergonômicas com assentos estofados pastel, encosto anatômico e base em estrela com rodinhas.
    - `LowPolyComputer`: Computadores desktop widescreen com teclado e mousepad, além de laptops compactos com telas iluminadas em azul pastel.
    - `MeetingTable`: Mesa de conferência espaçosa (3.4 x 1.6) com caixa de tomadas, laptop de apresentação e 4 cadeiras de reunião orientadas simetricamente.
    - `CoffeeStation`: Balcão de café com tampo em mármore claro, cafeteira express low-poly com grupos de extração e manoplas, canecas coloridas e mesinha bistrô com banquetas.
    - `LoungeArea`: Área de convivência com tapete delimitador, sofá moderno de 3 lugares com almofadas de destaque, mesinha de centro baixa com revista corporativa e luminária alta de chão.
    - `LowPolyPlant`: Vasos geométricos cerâmicos com terra e folhagem facetada estilizada.
    - `OfficeEnvironment`: Orquestrador data-driven integrando todas as áreas e garantindo corredores centrais amplos e livres.
    - `OfficeScene`: Integração da câmera ortográfica isométrica e iluminação suave com sombras suaves (`PCFSoftShadowMap`).
  - Testes unitários com Vitest em `src/game/config/officeLayout.test.ts` e `src/game/scene/office/officeLayoutMetrics.test.ts` (12 testes passando).

---

## [0.2.0] - 2026-09-02

### Adicionado
- **TASK-001: Fundação técnica 3D e dependências essenciais**
  - Instalação e integração das bibliotecas 3D e estado: `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `zustand` e `vitest`.
  - Implementação modular dos componentes centrais:
    - `src/game/GameShell.tsx`: Container raiz responsável pela orquestração do Canvas, Error Boundary, detecção de WebGL e UIOverlay.
    - `src/game/scene/GameCanvas.tsx`: Canvas Three.js em tela cheia com `outputColorSpace = SRGBColorSpace`, sombras `PCFSoftShadowMap`, antialias, controle de DPR `[1, 1.5]` e background sólido.
    - `src/game/scene/TestScene.tsx`: Cena de teste com câmera ortográfica isométrica 3/4, iluminação ambiente/hemisférica/direcional suave com sombras, plano receptor e cubo low poly procedural rotacionando via `useRef` sem re-renders React.
    - `src/game/config/sceneConfig.ts`: Centralização data-driven de parâmetros gráficos, câmera e luzes.
    - `src/ui/components/GameErrorBoundary.tsx`: Error Boundary para captura e recuperação de falhas de renderização.
    - `src/ui/components/LoadingFallback.tsx`: Interface de carregamento do ambiente 3D.
    - `src/ui/components/WebGLFallback.tsx`: Tela amigável de contingência caso o navegador não possua suporte a WebGL.
    - `src/ui/panels/UIOverlay.tsx`: Camada de interface sobreposta para informações técnicas.
    - `src/utils/webgl.ts` e `src/utils/webgl.test.ts`: Utilitário de detecção de contexto WebGL com testes unitários.
  - Adição do script `"test": "vitest run"` em `package.json`.

---

## [0.1.0] - 2026-09-02

### Adicionado
- **TASK-000: Fundação documental do projeto**
  - Criação de `GAME_SPEC.md` contendo a especificação do produto, pilares estéticos, regras de simulação determinística, ciclo de vida dos agentes e diretrizes para futura integração com IA.
  - Criação de `ARCHITECTURE.md` definindo a estrutura modular do código (`src/game/`, `src/ui/`, `src/store/`), separação rigorosa entre simulação pura e renderização gráfica, stack tecnológica planejada e boas práticas de performance no Three.js / R3F.
  - Criação de `ROADMAP.md` estruturando as fases de desenvolvimento do MVP (Fases 0 a 8), marcando `TASK-000` como concluída e registrando os próximos passos de forma não executada.
  - Criação de `CHANGELOG.md` para rastreamento formal de versões e alterações do projeto.
  - Atualização de `metadata.json` e sincronização de metadados em `index.html` com o nome formal "Agent Office Diorama" e descrição detalhada do simulador.

### Preservado
- Preservação integral do código de execução existente e compatibilidade de compilação sem inclusão de bibliotecas 3D antecipadas ou telas prematuras.
