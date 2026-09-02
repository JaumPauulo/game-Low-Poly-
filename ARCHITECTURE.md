# ARCHITECTURE.md — Agent Office Diorama

## 1. Visão Arquitetural

A arquitetura do **Agent Office Diorama** baseia-se no princípio de estrita **separação de responsabilidades** e **desacoplamento funcional**. 

O núcleo da simulação matemática e o motor de navegação operam como sistemas independentes em TypeScript puro, completamente livres de dependências de bibliotecas de renderização (Three.js / @react-three/fiber) ou bibliotecas de interface visual (React). A interface gráfica e a cena 3D atuam estritamente como camadas de observação e controle do estado lógico.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Framework Base** | React 19 + TypeScript (Strict Mode) | Estruturação de componentes e ciclo de vida da aplicação |
| **Renderização 3D** | Three.js | Motor de computação gráfica WebGL |
| **Binding Reativo 3D** | @react-three/fiber | Integração declarativa do Three.js com o ecossistema React |
| **Utilitários 3D** | @react-three/drei | Câmera ortográfica controlada, abstrações de cena e iluminação |
| **Gerenciamento de Estado** | Zustand | Única fonte da verdade para o estado da simulação e UI |
| **Estilos e Layout** | Tailwind CSS v4 | Estilização responsiva de painéis, drawers e controles |
| **Ícones** | Lucide React | Conjunto de ícones vetoriais padronizados |
| **Testes Unitários** | Vitest | Validação matemática de lógica pura, pathfinding e simulação |
| **Backend / API (Opcional)** | Express + @google/genai | Proxy seguro server-side para recursos opcionais de IA |

---

## 3. Estrutura Modular de Diretórios

```
src/
├── game/                     # Domínio de gameplay e simulação 3D
│   ├── config/               # Definições data-driven (grid, zonas, layouts, presets de agentes)
│   │   ├── dioramaConfig.ts  # Dimensões da base, materiais, limites de pan/zoom
│   │   ├── officeLayout.ts   # Posicionamento de estações, salas de reunião, lounge e corredores
│   │   └── agentConfig.ts    # Configurações de atributos, velocidades e taxas de decaimento
│   ├── core/                 # Fundamentos matemáticos e utilitários agnósticos
│   │   ├── prng.ts           # Gerador pseudoaleatório determinístico baseado em seed
│   │   ├── vector2d.ts       # Operações vetoriais 2D em grid
│   │   └── timeStep.ts       # Gerenciador de fixed timestep desacoplado
│   ├── navigation/           # Sistema de grid e pathfinding puro (TypeScript puro)
│   │   ├── grid.ts           # Representação matricial de células transitáveis e ocupáveis
│   │   └── astar.ts          # Algoritmo A* determinístico sem dependência de Three.js/React
│   ├── simulation/           # Regras de negócio, agentes e economia do escritório
│   │   ├── agentFSM.ts       # Máquina de estados finitos dos agentes (Idle, Walk, Work, Rest)
│   │   ├── occupancy.ts      # Gerenciador de ocupação exclusiva e coletiva de postos
│   │   ├── productivity.ts   # Fórmulas de produtividade, decaimento de energia e foco
│   │   ├── taskManager.ts    # Fila de tarefas, alocação e cálculo de progresso
│   │   └── engine.ts         # Orquestrador da simulação que executa o tick lógico
│   ├── scene/                # Camada Three.js / R3F do ambiente
│   │   ├── DioramaCanvas.tsx # Canvas raiz com configuração ortográfica e controle de render
│   │   ├── IsometricCamera.tsx # Câmera ortográfica com rotação em 90° e limites de zoom
│   │   ├── Lighting.tsx      # Iluminação difusa e direcional suave
│   │   └── OfficeEnvironment.tsx # Base do diorama, paredes baixas e zonas renderizadas
│   ├── entities/             # Representações visuais 3D (R3F)
│   │   ├── AgentMesh.tsx     # Agente chibi procedural (cabeça, corpo, animação procedural)
│   │   ├── FurnitureMesh.tsx # Mesas, computadores, cadeiras, sofás e máquina de café
│   │   └── PropMesh.tsx      # Pequenos detalhes do escritório (plantas, canecas, quadros)
│   └── systems/              # Sincronização entre lógica e render
│       └── useSimulationSync.ts # Conexão dos ticks da simulação com o loop gráfico
├── ui/                       # Camada de apresentação 2D (React + Tailwind)
│   ├── components/           # Elementos atômicos (barras de progresso, botões, chips de status)
│   └── panels/               # Painéis de controle de simulação, detalhes de agente e tarefas
├── hooks/                    # Hooks utilitários (viewport, responsive layout, atalhos)
├── utils/                    # Funções puras de formatação, debounce e acessibilidade
├── store/                    # Zustand store (única fonte de verdade do estado da aplicação)
│   └── useGameStore.ts
├── App.tsx                   # Composição principal: Canvas 3D + Camada de UI responsiva
├── index.css                 # Importação global do Tailwind CSS
└── main.tsx                  # Ponto de montagem React
```

---

## 4. Fronteiras e Regras Arquiteturais Obrigatórias

1. **Agnosticismo da Simulação**:
   - `src/game/simulation/` e `src/game/navigation/` **NÃO PODEM** importar React ou Three.js.
   - Devem conter apenas lógica determinística e tipos puros em TypeScript.
   - Devem ser 100% testáveis via Vitest em ambiente Node sem DOM ou WebGL.

2. **Renderização como Consumidor Puro**:
   - Componentes visuais em `src/game/scene/` e `src/game/entities/` são funções do estado.
   - Nenhum componente visual recalcula produtividade, aloca tarefas ou altera diretamente regras de ocupação.
   - Atualizações de posições nos frames visuais ocorrem por interpolação suave (lerp) via referências mutáveis (`useRef`), sem disparar `setState` React a cada frame.

3. **Arquitetura Data-Driven**:
   - Nenhuma coordenada mágica deve ser embutida diretamente nos componentes.
   - Posições de mesas, cadeiras, zonas de lounge e waypoints residem em arquivos de configuração (`src/game/config/officeLayout.ts`).

4. **Única Fonte da Verdade (Zustand)**:
   - O estado global é gerido por uma única store centralizada.
   - Ações da UI e ticks da simulação despacham mutações controladas de estado para a store, que notifica assinantes pontuais via seletores refinados para evitar re-renderizações desnecessárias.

---

## 5. Estratégias de Performance no Three.js / R3F

- **Prevenção de Garbage Collection no Loop**:
  - Proibida a alocação de novas instâncias de `Vector3`, `Euler`, `Quaternion`, `Matrix4`, materiais ou geometrias dentro de `useFrame`.
  - Reutilização de instâncias temporárias pré-alocadas em escopo de módulo ou `useMemo`/`useRef`.
- **Compartilhamento de Recursos Gráficos**:
  - Reutilização compartilhada de geometrias de primitivas (cubo da mesa, cilindro do corpo do agente, esfera da cabeça) e paletas de materiais foscos.
- **Limite de Device Pixel Ratio**:
  - Fixação de `dpr` em `[1, 1.5]` para evitar perda de performance em telas de alta densidade (Retina/Mobile).
- **Sombras e Luzes Otimizadas**:
  - Apenas 1 luz direcional gerando mapa de sombra com resolução controlada (ex.: 1024x1024) com frustum ortográfico ajustado estritamente ao volume do diorama.

---

## 6. Modelo de Simulação e Determinismo

- **Fixed Timestep**: A engine processa passos lógicos regulares ($\Delta t$ constante, ex.: $0.1s$ por tick).
- **PRNG**: Função geradora determinística:
  $$X_{n+1} = (a X_n + c) \pmod m$$
  Permite reproduzir a mesma rotina de agentes em testes automatizados e sessões com a mesma seed.
- **Formulação de Atributos**:
  $$\text{Energy}_{t+1} = \max\left(0, \min\left(100, \text{Energy}_t + \Delta \text{Energy}\right)\right)$$
  $$\text{Focus}_{t+1} = \max\left(0, \min\left(100, \text{Focus}_t + \Delta \text{Focus}\right)\right)$$
  $$\text{Productivity} = f(\text{Energy}, \text{Focus}, \text{ZoneAffinity})$$

---

## 7. Segurança e Extensibilidade com IA

- **Modo Offline/Local Garantido**: O núcleo da simulação independe de qualquer infraestrutura externa.
- **Isolamento de Credenciais**: `GEMINI_API_KEY` permanece estritamente no servidor Express; nunca é exposta ou prefixada como `VITE_`.
- **Comunicação por Schemas**: Toda resposta de IA opcional é validada via schema estrito antes de ser aplicada ao estado da aplicação.
