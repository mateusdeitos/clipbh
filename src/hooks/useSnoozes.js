import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/** @type {{ electronAPI: import("../../preload").ElectronAPI }} */
const win = window;

export function formatRemaining(expiresAt) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return null;
  const totalSecs = Math.ceil(diff / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const mins = Math.ceil(totalSecs / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = (diff / (1000 * 60 * 60)).toFixed(1);
  return `${hrs} hr`;
}

export function useSnoozes() {
  const queryClient = useQueryClient();
  const itemRefs = useRef({});
  const [highlightedId, setHighlightedId] = useState(null);
  const [, setTick] = useState(0);

  const { data: snoozedUntil = {} } = useQuery({
    queryKey: ['active-snoozes'],
    queryFn: () => win.electronAPI?.getActiveSnoozes() ?? {},
    refetchOnWindowFocus: false,
  });

  // Countdown tick every 30 s to refresh remaining-time labels
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Remove indicator when snooze fires
  useEffect(() => {
    if (!win.electronAPI) return;
    return win.electronAPI.onSnoozeExpired(({ id }) => {
      queryClient.setQueryData(['active-snoozes'], (prev = {}) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });
  }, [queryClient]);

  // Scroll to + highlight item when user clicks the notification
  useEffect(() => {
    if (!win.electronAPI) return;
    return win.electronAPI.onSnoozeFocus(({ id }) => {
      const el = itemRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(id);
        setTimeout(() => setHighlightedId(null), 2000);
      }
    });
  }, []);

  const snooze = useCallback(async (id, durationMs) => {
    await win.electronAPI?.snoozeEntry(id, durationMs);
    queryClient.setQueryData(['active-snoozes'], (prev = {}) => ({
      ...prev,
      [id]: Date.now() + durationMs,
    }));
  }, [queryClient]);

  const cancelSnooze = useCallback(async (id) => {
    await win.electronAPI?.cancelSnooze(id);
    queryClient.setQueryData(['active-snoozes'], (prev = {}) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [queryClient]);

  return { snoozedUntil, highlightedId, itemRefs, snooze, cancelSnooze };
}
