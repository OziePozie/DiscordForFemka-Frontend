import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
}

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;
  const setValue = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [value, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn('space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-6 border-b border-line text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  ...props
}: TabsTriggerProps) {
  const ctx = useTabsContext();
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? 'active' : 'inactive'}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'relative -mb-px inline-flex items-center justify-center whitespace-nowrap border-b-[1.5px] px-1 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'border-ink text-ink'
          : 'border-transparent hover:text-ink',
        className,
      )}
      {...props}
    />
  );
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  className,
  ...props
}: TabsContentProps) {
  const ctx = useTabsContext();
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      className={cn(
        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  );
}
