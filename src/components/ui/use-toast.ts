// Lightweight toast hook backed by Radix Toast primitives.
// Не используем shadcn Reducer-based ToastViewport (упростили API под наши нужды).
import * as React from 'react';

type ToastVariant = 'default' | 'destructive';

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ToastStore {
  toasts: ToastItem[];
  listeners: Set<(t: ToastItem[]) => void>;
}

const store: ToastStore = { toasts: [], listeners: new Set() };

function emit() {
  store.listeners.forEach((l) => l([...store.toasts]));
}

function add(t: Omit<ToastItem, 'id'>): string {
  const id = Math.random().toString(36).slice(2);
  store.toasts.push({ id, ...t });
  emit();
  setTimeout(() => dismiss(id), 4000);
  return id;
}

function dismiss(id: string) {
  store.toasts = store.toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const [, force] = React.useState<ToastItem[]>(store.toasts);
  React.useEffect(() => {
    store.listeners.add(force);
    return () => {
      store.listeners.delete(force);
    };
  }, []);
  return {
    toasts: store.toasts,
    toast: (t: Omit<ToastItem, 'id'>) => add(t),
    dismiss,
  };
}
