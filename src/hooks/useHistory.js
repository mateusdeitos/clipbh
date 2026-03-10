import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

/** @type {{ electronAPI: import("../../preload").ElectronAPI }} */
const win = window;

export function useHistory(searchQuery = "", selector) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["history"] }),
    [queryClient]
  );

  useEffect(() => {
    if (!win.electronAPI) return;
    const unsubscribe = win.electronAPI.onClipboardUpdate(invalidate);
    return unsubscribe;
  }, [invalidate]);

  const query = useQuery({
    queryKey: ["history", searchQuery],
    queryFn: () => win.electronAPI?.getHistory(searchQuery) ?? [],
    select: selector,
    refetchOnWindowFocus: true,
  });

  return { ...query, invalidate };
}
