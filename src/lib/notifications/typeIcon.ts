import { Swords, Radio, type LucideIcon } from 'lucide-react';
import type { NotificationType } from '@/lib/api/types';

/** Иконка для типа уведомления. Общий источник для колокольчика и тоста. */
export function typeIcon(type: NotificationType | undefined): LucideIcon {
  return type === 'MATCH_READY_CHECK' ? Swords : Radio;
}
