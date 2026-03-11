## Why

Atualmente o monitoramento do clipboard está sempre ativo e o usuário não tem controle sobre quando quer pausá-lo, nem visibilidade do estado atual. Isso é útil quando o usuário deseja copiar conteúdos temporários sem que sejam persistidos no histórico.

## What Changes

- Adicionar controle de estado do watch no processo principal (main.js) com a capacidade de pausar/retomar o polling do clipboard
- Expor um novo IPC handler `toggle-clipboard-watch` e um getter `get-watch-status` para o renderer
- Adicionar `window.electronAPI.toggleWatch()` e `window.electronAPI.getWatchStatus()` no preload
- Exibir um botão na UI com indicador visual (spinner animado quando ativo) que reflete o estado atual e permite alternar o monitoramento

## Capabilities

### New Capabilities

- `clipboard-watch-toggle`: Controle de ativação/desativação do monitoramento do clipboard, com indicador visual de estado na UI

### Modified Capabilities

<!-- Nenhuma capability existente tem requisitos sendo alterados -->

## Impact

- `main.js`: adicionar variável de estado `isWatching`, lógica condicional no loop de polling, e novos IPC handlers
- `preload.js`: expor `toggleWatch` e `getWatchStatus` via `contextBridge`
- `src/App.jsx`: adicionar botão com spinner e integração com as novas APIs
