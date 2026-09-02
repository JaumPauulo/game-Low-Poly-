# GAME_SPEC.md — Agent Office Diorama

## 1. Visão Geral do Produto

**Agent Office Diorama** é um simulador interativo de escritório virtual apresentado na forma de uma maquete/diorama 3D flutuante, com visão isométrica ortográfica. O mundo é habitado por agentes autônomos estilizados no formato chibi/minifig, que desempenham rotinas de trabalho, colaboração, pausas para café e reuniões de equipe.

O produto é construído sobre o princípio de **simulação local determinística**: toda a dinâmica de gameplay, movimento, tomadas de decisão e métricas funciona diretamente no cliente, de forma autônoma e consistente, sem exigir conexões ativas com serviços externos ou modelos de nuvem para seu núcleo de funcionamento.

---

## 2. Pilares de Design e Estética

### 2.1 Estética e Direção Visual 3D
- **Diorama Flutuante**: O cenário é concebido como uma maquete recortada sobre um pedestal/base flutuante, destacando o ambiente de trabalho como uma miniatura de precisão.
- **Low Poly Procedural**: Modelagem geométrica estilizada construída a partir de primitivas geométricas nativas do Three.js (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`). Não utiliza modelos GLTF/GLB externos ou texturas fotográficas.
- **Personagens Chibi / Minifig**: Agentes com proporções de miniatura, cabeças ligeiramente aumentadas em relação ao corpo, formas cilíndricas/cúbicas simplificadas e silhuetas de fácil leitura.
- **Paleta de Cores**: Tons sólidos e pastéis suaves, com contraste balanceado para garantir legibilidade de agentes e objetos em qualquer ângulo.
- **Materiais e Shading**: Materiais opacos/foscos com `roughness` alta (0.7–0.9), `metalness` nula ou baixa (0.0–0.1) e uso criterioso de `flatShading` para valorizar as facetas poligonais da maquete.
- **Iluminação**: Luz ambiente difusa complementada por luz direcional chave (key light) suave, projetando sombras difusas e limpas sobre a base do diorama.

### 2.2 Câmera Ortográfica Isométrica
- **Projeção Ortográfica**: Utiliza exclusivamente `OrthographicCamera` para eliminar distorções de perspectiva angular e garantir que elementos em diferentes profundidades mantenham a mesma escala aparente.
- **Ângulo 3/4 Isométrico**: Posição angular padrão mantendo proporções isométricas clássicas.
- **Rotação Discreta em 90°**: Rotação da câmera permitida estritamente em passos exatos de 90 graus (Norte, Leste, Sul, Oeste), permitindo inspecionar o diorama por trás de móveis sem perda de enquadramento.
- **Controle de Zoom e Pan**: Zoom delimitado por valores mínimos e máximos com amortecimento suave. Pan restrito aos limites da base do diorama.
- **Responsividade**: Adaptação precisa a janelas desktop e telas verticais de smartphones sem distorcer proporções.

---

## 3. Mecânicas de Gameplay e Simulação

### 3.1 Loop de Simulação Determinístico
- **Fixed Timestep**: O avanço da simulação obedece a intervalos discretos de tempo (ticks lógicos fixos, ex.: 10 ticks/s ou 20 ticks/s), desacoplados da taxa de renderização de frames do display.
- **Gerador Pseudoaleatório com Seed (PRNG)**: Todas as decisões aleatórias utilizam um gerador baseado em seed (ex.: Mulberry32 ou xoshiro), garantindo reprodutibilidade de trajetórias e eventos para a mesma semente inicial.
- **Desacoplamento Temporal**: A lógica da simulação não consome `Date.now()` nem `Math.random()` diretamente.

### 3.2 Agentes e Atributos Vitais
Cada agente no diorama possui estado individual e atributos quantitativos limitados no intervalo `[0, 100]`:
- **Energia (`energy`)**:
  - Drena gradativamente durante tarefas ativas e deslocamentos.
  - Recuperada em pausas nas estações de café ou no lounge de descanso.
- **Foco (`focus`)**:
  - Aumenta a velocidade de entrega e reduz taxas de erro em tarefas complexas.
  - Decai com interrupções contínuas, fadiga ou tempo prolongado sem pausas.
- **Produtividade (`productivity`)**:
  - Fator composto resultante de Energia, Foco e proximidade dos recursos ideais de trabalho.
- **Humor / Satisfação (`mood`)**:
  - Influenciado por conclusão de metas, interação com colegas e equilíbrio entre esforço e descanso.

### 3.3 Estados Comportamentais (FSM do Agente)
- `IDLE`: Aguardando alocação de tarefa ou decidindo próximo destino.
- `NAVIGATING`: Movendo-se através do grid de navegação em direção a um waypoint ou posto específico.
- `WORKING`: Sentado ou posicionado em uma mesa de trabalho executando tarefas ativas.
- `COLLABORATING`: Participando de reuniões em grupo ou alinhamentos na mesa central/sala de reuniões.
- `RESTING`: Recarregando energia na copa, máquina de café ou poltronas de descompressão.

### 3.4 Zonas, Ocupação e Objetos Interativos
O diorama é dividido em zonas funcionais lógicas:
1. **Workstations (Mesas Individuais)**: Postos de trabalho equipados com computadores e cadeiras. Suportam ocupação única por agente.
2. **Meeting Area (Sala / Mesa de Reunião)**: Espaço compartilhado que comporta múltiplos agentes simultâneos para colaboração com bônus de foco coletivo.
3. **Coffee Corner / Break Area**: Área de descanso com máquina de café e sofás, com capacidade máxima definida por configuração.
4. **Passagens e Corredores**: Células transitáveis para navegação fluida sem sobreposição ou bloqueio de rotas.

### 3.5 Sistema de Tarefas e Projetos
- **Backlog de Tarefas**: Lista de demandas do escritório classificadas por tipo (Código, Design, Operações, Pesquisa).
- **Alocação de Tarefas**: Agentes livres buscam tarefas compatíveis no backlog ou recebem tarefas designadas.
- **Progresso e Conclusão**: O progresso acumula a cada tick proporcional à produtividade do agente atuante. A conclusão gera métricas de entrega e experiência para o agente.

---

## 4. Integração Opcional com Gemini AI

- **Caráter Estritamente Opcional**: O jogo funciona de forma completa, divertida e autônoma sem IA conectada.
- **Segurança e Arquitetura Server-Side**: Nenhuma chamada ao modelo Gemini ocorre diretamente no navegador. Toda requisição é mediada por rotas seguras de backend (`/api/*`), preservando variáveis sensíveis como `GEMINI_API_KEY`.
- **Casos de Aplicação Opcional**:
  - Geração de diálogos contextuais sutis entre agentes durante reuniões ou pausas para café.
  - Sumarização e geração temática de tarefas de trabalho adicionadas ao backlog.
  - Validação estrita de retornos via schemas estruturados, evitando qualquer execução de texto livre arbitrário.

---

## 5. Acessibilidade e Interface

- **Interface Desacoplada**: Painéis informativos, controles de simulação (play/pause/speed) e detalhes de agentes organizados em layouts responsivos (sidebar em desktop, drawers/bottom-sheets em mobile).
- **Clareza de Dados**: Barras de progresso com rótulos textuais legíveis, ícones claros da biblioteca `lucide-react`, contraste adequado (WCAG AA).
- **Controles Universais**: Suporte integral a mouse, touch screen e atalhos de teclado (com salvaguarda para não interceptar campos de digitação).
