import { useCallback, useEffect, useState } from 'react';

let activeId: string | null = null;
const listeners = new Set<(next: string | null) => void>();

function broadcast(next: string | null) {
  if (activeId === next) return;
  activeId = next;
  listeners.forEach((cb) => cb(next));
}

export function useHoverCardSingleton(id: string) {
  const [open, setOpenState] = useState(false);

  useEffect(() => {
    const onChange = (next: string | null) => {
      if (next !== id) setOpenState(false);
    };
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
      if (activeId === id) broadcast(null);
    };
  }, [id]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        broadcast(id);
        setOpenState(true);
      } else {
        if (activeId === id) broadcast(null);
        setOpenState(false);
      }
    },
    [id],
  );

  const claim = useCallback(() => {
    broadcast(id);
  }, [id]);

  return { open, setOpen, claim };
}
