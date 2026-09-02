# CHANGELOG.md — Agent Office Diorama

Todas as modificações relevantes e marcos técnicos deste projeto são documentados neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

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
