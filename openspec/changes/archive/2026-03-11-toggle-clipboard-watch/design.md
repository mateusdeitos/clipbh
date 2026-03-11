## Context

O clipbh monitora o clipboard via `setInterval` no processo principal (main.js), disparando a cada 1 segundo. Atualmente não existe forma de pausar esse monitoramento: ele começa na inicialização e nunca para. O renderer não tem conhecimento do estado do watch. A feature adiciona controle explícito sobre esse ciclo sem alterar a arquitetura existente.

## Goals / Non-Goals

**Goals:**
- Permitir pausar e retomar o monitoramento do clipboard via IPC
- Exibir o estado atual do watch no renderer com indicador visual (spinner)
- Persistir o estado entre sessões (iniciar pausado se estava pausado)

**Non-Goals:**
- Agendamento por horário ou regras automáticas de pausa
- Pausa por tipo de conteúdo (ex: só pausar imagens)
- Configurações avançadas de polling interval

## Decisions

### Estado no processo principal

**Decisão**: Usar uma variável booleana `isWatching` em `main.js` que controla se o callback do `setInterval` executa a captura.

**Alternativa considerada**: Usar `clearInterval` / `setInterval` para realmente parar e reiniciar o timer.

**Rationale**: Manter o interval sempre rodando e apenas condicionar a execução internamente é mais simples — não precisa gerenciar referência do timer para clear/restart, e evita edge cases de múltiplos intervals. O overhead de um no-op a cada segundo é desprezível.

### Comunicação renderer ↔ main

**Decisão**: Dois novos IPC channels:
- `toggle-clipboard-watch` (invoke): alterna o estado e retorna o novo valor booleano
- `get-watch-status` (invoke): retorna o estado atual sem alterá-lo

**Alternativa considerada**: Emitir evento do main para o renderer sempre que o estado mudar.

**Rationale**: O padrão `invoke/handle` é mais simples para operações request-response. O renderer consulta o estado inicial via `get-watch-status` e atualiza otimisticamente após o toggle com base no valor retornado.

### Obtenção do estado no renderer

**Decisão**: Criar um hook `useWatchStatus` que usa `useQuery` para buscar o estado via `window.electronAPI.getWatchStatus()`.

**Alternativa considerada**: Gerenciar o estado com `useState` + `useEffect` manualmente.

**Rationale**: `useQuery` oferece cache, loading state e refetch automático sem boilerplate adicional. O estado do watch é essencialmente dados remotos (vivem no processo main), então o padrão query é semanticamente correto. Após o toggle, a query é invalidada via `queryClient.invalidateQueries` para refletir o novo estado — sem atualização otimista.

### Persistência do estado

**Decisão**: Sem persistência — o watch sempre inicia ativo ao abrir a aplicação.

**Alternativa considerada**: Salvar estado em `userData/config.json`.

**Rationale**: Simplicidade. O caso de uso de pausar é pontual (durante uma sessão de trabalho), não uma preferência persistente. Iniciar sempre ativo é o comportamento mais previsível.

### UI: indicador de estado

**Decisão**: Botão com spinner CSS animado quando ativo, ícone estático quando pausado. O botão fica no header da aplicação.

**Alternativa considerada**: Toggle switch ou checkbox.

**Rationale**: O spinner comunica de forma intuitiva que "algo está acontecendo em tempo real". Um clique para pausar/retomar é mais rápido que um toggle switch com label.

## Risks / Trade-offs

- **Estado dessincronizado**: Se o renderer e o main divergirem sobre o estado, o botão mostrará informação errada. → Mitigação: sempre invalidar a query após o toggle para garantir que o estado exibido reflita a fonte da verdade (processo main).
- **Entradas perdidas no gap**: Ao reativar o watch, conteúdo copiado enquanto pausado não será capturado — isso é o comportamento esperado, mas deve ser comunicado ao usuário. → Mitigação: tooltip ou texto no botão indicando "monitoramento pausado".
