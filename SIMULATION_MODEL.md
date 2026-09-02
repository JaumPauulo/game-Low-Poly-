# Modelo Lógico e Determinístico da Simulação

Este documento define as especificações formais, estados, transições, fórmulas matemáticas, invariantes, eventos e comandos do motor de simulação do **Agent Office Diorama**.

O motor é estritamente desacoplado de bibliotecas de interface ou renderização (React, Zustand, Three.js) e opera sob determinismo estrito a partir de sementes pseudoaleatórias (PRNG Mulberry32), sem dependências diretas de `Date.now` ou `Math.random`.

---

## 1. Modelo de Tempo e Execução

- **Fixed Timestep:** Padrão recomendado de 250 ms (`deltaSeconds = 0.25`).
- **Escala de Velocidade:** Suporte a 1x, 2x e 4x via multiplicador `timeScale`.
- **Pausa (`isPaused`):** Quando a simulação está pausada ou `deltaSeconds <= 0`, o estado é retornado inalterado sem gerar novos eventos ou comandos.
- **Determinismo:** Dada a mesma semente inicial e os mesmos inputs, a execução reproduz estados e eventos de forma 100% idêntica.

---

## 2. Estados dos Agentes e Transições

### Estados Disponíveis

| Estado | Descrição |
| :--- | :--- |
| `idle` | Agente livre, avaliando backlog ou aguardando novas tarefas. |
| `planning` | Reflexão estratégica inicial antes de iniciar tarefas de alta complexidade. |
| `walking` | Deslocamento lógico entre zonas (`workstations`, `meeting`, `coffee`, `lounge`). |
| `working` | Execução ativa da tarefa atribuída, gerando progresso e consumindo energia/foco. |
| `thinking` | Pausa mental breve e recuperação de foco durante tarefas complexas. |
| `collaborating`| Apoio cooperativo temporário de um agente a outro em tarefa complexa. |
| `coffee` | Pausa restaurativa na cafeteria para recarregar energia e foco. |
| `talking` | Interação verbal ou alinhamento em reuniões/colaborações. |
| `error` | Estado defensivo isolado quando dados inconsistentes são detectados. |

### Diagrama de Transições Principais

```text
       [idle]
         │  (seleciona tarefa elegível)
         ▼
      [walking] ───(chega na estação)───► [thinking / planning] (se complexidade >= 4)
         │                                      │
         │ (se complexidade normal)             │ (após tempo de reflexão)
         └──────────────────────┬───────────────┘
                                ▼
                            [working] ◄──── [collaborating] (agente parceiro)
                           /        \
   (energia <= 0.20)     /            \  (progresso >= 1.0)
                       ▼                ▼
                   [walking]      [TASK_COMPLETED]
                       │                │
                (chega ao café)         ▼
                       ▼              [idle]
                   [coffee]
                       │
           (energia >= 0.95)
                       │
                       ▼
       [walking] (retorna ao trabalho pendente)
```

---

## 3. Fórmulas Matemáticas

### 3.1. Fator de Afinidade de Habilidade (`skillFactor`)
Varia de 0.5 (afinidade nula) a 1.0 (afinidade máxima):
$$\text{skillFactor} = 0.5 + 0.5 \times \text{clamp}(\text{affinity}, 0, 1)$$

### 3.2. Fator de Complexidade (`complexityFactor`)
Inversamente proporcional à complexidade (1 a 5):
$$\text{complexityFactor} = \frac{1.0}{1.0 + (\text{complexity} - 1) \times 0.5}$$
- Complexidade 1: $1.000$
- Complexidade 2: $0.667$
- Complexidade 3: $0.500$
- Complexidade 4: $0.400$
- Complexidade 5: $0.333$

### 3.3. Fator de Energia (`energyFactor`)
Abaixo do limiar de fadiga ($\text{lowEnergyThreshold} = 0.20$), há decaimento quadrático:
$$\text{energyFactor} = \begin{cases} 
0, & \text{se } \text{energy} \le 0 \\
\left(\frac{\text{energy}}{0.20}\right)^2 \times 0.3, & \text{se } 0 < \text{energy} < 0.20 \\
0.3 + 0.7 \times \left(\frac{\text{energy} - 0.20}{0.80}\right), & \text{se } \text{energy} \ge 0.20 
\end{cases}$$

### 3.4. Fator de Foco (`focusFactor`)
$$\text{focusFactor} = 0.40 + 0.60 \times \text{clamp}(\text{focus}, 0, 1)$$

### 3.5. Multiplicador de Colaboração Limitado (`collabMultiplier`)
O bônus de colaboração possui teto rígido inviolável ($\text{maxBonus} = 0.25$):
$$\text{collabMultiplier} = 1.0 + \text{clamp}(\text{bonus}, 0, \text{maxBonus})$$

### 3.6. Produtividade Instantânea e Progresso Incremental
$$\text{ratePerSecond} = \text{baseWorkRate} \times \text{skillFactor} \times \text{complexityFactor} \times \text{energyFactor} \times \text{focusFactor} \times \text{collabMultiplier}$$
$$\Delta \text{progress} = \text{ratePerSecond} \times \Delta t_{\text{effective}}$$
$$\text{progress}_{\text{new}} = \text{clamp}(\text{progress}_{\text{current}} + \Delta \text{progress}, 0, 1)$$

### 3.7. Consumo e Recuperação de Atributos
- **Trabalho Ativo (`working`):**
  $$\text{energy}_{t+\Delta t} = \text{clamp}(\text{energy}_t - \text{energyDrainRate} \times \Delta t, 0, 1)$$
  $$\text{focus}_{t+\Delta t} = \text{clamp}(\text{focus}_t - \text{focusDrainRate} \times \Delta t, 0, 1)$$
- **Pausa de Café (`coffee`):**
  $$\text{energy}_{t+\Delta t} = \text{clamp}(\text{energy}_t + \text{energyRecoveryRate} \times \Delta t, 0, 1)$$
  $$\text{focus}_{t+\Delta t} = \text{clamp}(\text{focus}_t + \text{focusRecoveryRate} \times \Delta t, 0, 1)$$

---

## 4. Invariantes do Sistema

1. **Monotonicidade do Progresso:** O progresso de uma tarefa nunca diminui ($\Delta \text{progress} \ge 0$).
2. **Limites de Estado:** $\text{progress} \in [0, 1]$, $\text{energy} \in [0, 1]$, $\text{focus} \in [0, 1]$.
3. **Determinismo:** Nenhuma rotina depende de tempo de sistema (`Date.now`) ou geradores não-determinísticos (`Math.random`).
4. **Respeito a Dependências:** Nenhuma tarefa com dependências não concluídas pode ser assumida ou iniciada; seu status é estritamente `blocked`.
5. **Idempotência de Tarefas Concluídas:** Uma tarefa concluída (`completed`) não pode ser reiniciada ou reatribuída.
6. **Isolamento de Erros:** Erros de integridade em uma entidade colocam apenas aquela entidade no estado `error`, mantendo a simulação global ativa e íntegra.

---

## 5. Eventos de Simulação (`SimulationEvent`)

| Evento | Momento de Emissão |
| :--- | :--- |
| `AGENT_STATE_CHANGED` | Agente transiciona para um novo estado comportamental. |
| `TASK_ASSIGNED` | Tarefa elegível alocada para um agente livre. |
| `TASK_STARTED` | Início do trabalho ativo em uma tarefa na estação. |
| `TASK_PROGRESS` | Incremento periódico do progresso da tarefa. |
| `TASK_COMPLETED` | Progresso atinge 1.0; tarefa concluída com sucesso. |
| `TASK_BLOCKED` | Tarefa com dependências pendentes marcada como bloqueada. |
| `COFFEE_BREAK_STARTED` | Agente com baixa energia inicia descanso na cafeteria. |
| `COFFEE_BREAK_ENDED` | Agente atinge energia restaurada e encerra pausa. |
| `COLLABORATION_STARTED` | Agente livre passa a cooperar em tarefa complexa. |
| `COLLABORATION_ENDED` | Cooperação encerrada por fadiga ou conclusão. |
| `AGENT_ERROR` | Falha controlada de integridade de dados do agente. |

---

## 6. Comandos de Simulação (`SimulationCommand`)

Comandos representam intenções emitidas pela simulação para execução por subsistemas visuais e de navegação:

| Comando | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `MOVE_TO_ZONE` | `agentId`, `targetZoneId` | Solicita deslocamento do agente até a zona especificada. |
| `START_WORK` | `agentId`, `taskId` | Solicita início da animação e ciclo de trabalho. |
| `START_COFFEE_BREAK` | `agentId` | Solicita início da pausa restaurativa no café. |
| `START_COLLABORATION`| `agentId`, `targetAgentId`, `taskId` | Solicita início da interação colaborativa. |
| `EMIT_MESSAGE` | `agentId`, `message` | Notifica mensagem ou aviso de status para interface/chat. |
