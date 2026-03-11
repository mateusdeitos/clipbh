import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** @type {{ electronAPI: import("../../preload").ElectronAPI }} */
const win = window;

export function useWatchStatus() {
  return useQuery({
    queryKey: ["watch-status"],
    queryFn: () => win.electronAPI?.getWatchStatus() ?? true,
  });
}

export function useToggleWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => win.electronAPI?.toggleWatch(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watch-status"] }),
  });
}
