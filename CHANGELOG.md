# CHANGELOG.md — Agent Office Diorama

Todas as modificações relevantes e marcos técnicos deste projeto são documentados neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

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
