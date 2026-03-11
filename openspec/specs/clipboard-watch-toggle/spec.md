## Requirements

### Requirement: Toggle watch via IPC
O processo principal SHALL expor dois IPC handlers: `get-watch-status` (retorna o estado atual como booleano) e `toggle-clipboard-watch` (inverte o estado e retorna o novo valor). O watch SHALL iniciar ativo (`true`) sempre que a aplicação for aberta.

#### Scenario: Consultar estado inicial
- **WHEN** o renderer invoca `get-watch-status` ao montar
- **THEN** retorna `true` (watch sempre inicia ativo)

#### Scenario: Desativar o watch
- **WHEN** o renderer invoca `toggle-clipboard-watch` com watch ativo
- **THEN** o polling para de capturar entradas e retorna `false`

#### Scenario: Reativar o watch
- **WHEN** o renderer invoca `toggle-clipboard-watch` com watch inativo
- **THEN** o polling volta a capturar entradas e retorna `true`

### Requirement: Hook useWatchStatus
O renderer SHALL ter um hook `useWatchStatus` que usa `useQuery` para buscar o estado do watch via `window.electronAPI.getWatchStatus()`.

#### Scenario: Estado carregado no mount
- **WHEN** o componente que usa `useWatchStatus` é montado
- **THEN** o hook busca e retorna o estado atual do watch

#### Scenario: Invalidação após toggle
- **WHEN** o usuário clica no botão de toggle
- **THEN** a mutation chama `toggleWatch` e em seguida invalida a query de `useWatchStatus`, causando refetch

### Requirement: Botão de toggle na UI
A UI SHALL exibir um botão no header que indica o estado atual do watch e permite alterná-lo com um clique.

#### Scenario: Watch ativo — exibir spinner
- **WHEN** o watch está ativo
- **THEN** o botão exibe um spinner animado (indicando monitoramento em tempo real)

#### Scenario: Watch inativo — exibir ícone pausado
- **WHEN** o watch está inativo
- **THEN** o botão exibe um ícone estático indicando que o monitoramento está pausado

#### Scenario: Clicar no botão
- **WHEN** o usuário clica no botão
- **THEN** o estado é alternado e a UI atualiza para refletir o novo estado
