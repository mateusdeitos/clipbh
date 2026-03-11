## 1. Main Process — IPC handlers

- [x] 1.1 Adicionar variável `let isWatching = true` em `main.js`
- [x] 1.2 Envolver a lógica de captura do clipboard no `setInterval` com condicional `if (isWatching)`
- [x] 1.3 Adicionar IPC handler `get-watch-status` que retorna `isWatching`
- [x] 1.4 Adicionar IPC handler `toggle-clipboard-watch` que inverte `isWatching` e retorna o novo valor

## 2. Preload — expor APIs

- [x] 2.1 Adicionar `getWatchStatus: () => ipcRenderer.invoke('get-watch-status')` no `contextBridge`
- [x] 2.2 Adicionar `toggleWatch: () => ipcRenderer.invoke('toggle-clipboard-watch')` no `contextBridge`

## 3. Renderer — hook e mutation

- [x] 3.1 Verificar se `@tanstack/react-query` está instalado; instalar se necessário
- [x] 3.2 Criar hook `useWatchStatus` usando `useQuery` com `queryKey: ['watch-status']` e `queryFn: window.electronAPI.getWatchStatus`
- [x] 3.3 Criar mutation `useToggleWatch` usando `useMutation` que chama `window.electronAPI.toggleWatch` e invalida a query `watch-status` no `onSuccess`

## 4. UI — botão de toggle

- [x] 4.1 Adicionar botão no header de `App.jsx` que usa `useWatchStatus` e `useToggleWatch`
- [x] 4.2 Quando watch ativo: exibir spinner CSS animado no botão
- [x] 4.3 Quando watch inativo: exibir ícone estático (ex: ícone de pause) no botão
