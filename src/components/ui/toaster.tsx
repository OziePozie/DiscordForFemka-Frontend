import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();
  return (
    <>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant ?? 'default'}
          onClick={t.onClick}
          className={t.onClick ? 'cursor-pointer' : undefined}
        >
          <div className="flex items-start gap-3">
            {t.icon && <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />}
            <div className="grid gap-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
          </div>
          <ToastClose onClick={(e) => e.stopPropagation()} />
        </Toast>
      ))}
    </>
  );
}
