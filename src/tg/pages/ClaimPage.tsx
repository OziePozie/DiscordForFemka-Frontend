import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { telegramClaim } from '@/lib/api/endpoints';
import { ProblemDetailError } from '@/lib/api/client';
import { getInitData, webApp } from '../lib/telegram';
import { tgQk } from '../TelegramAuthGate';

/** Приводит ввод к виду XXXX-XXXX-XXXX, не мешая вставке из буфера. */
function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12);
  return clean.replace(/(.{4})(?=.)/g, '$1-');
}

function claimErrorText(error: unknown): string {
  if (!(error instanceof ProblemDetailError)) {
    return 'Что-то пошло не так. Попробуйте ещё раз.';
  }
  if (error.status === 404) return 'Код не найден — проверьте символы.';
  if (error.status === 409) {
    return error.detail?.includes('already linked') || error.detail?.includes('already has')
      ? 'Этот Telegram уже привязан к анкете (или у анкеты уже есть Telegram).'
      : 'Код больше не действует: он уже использован, отозван или истёк.';
  }
  if (error.status === 400) return 'Этот код предназначен для другого действия.';
  return 'Не удалось привязать анкету. Обратитесь к администрации.';
}

export default function ClaimPage({
  telegramUsername,
}: {
  telegramUsername: string | null;
}) {
  const [code, setCode] = useState('');
  const qc = useQueryClient();

  const claim = useMutation({
    mutationFn: () => telegramClaim(getInitData(), code),
    onSuccess: (data) => {
      webApp()?.HapticFeedback?.notificationOccurred('success');
      qc.setQueryData(tgQk.init, data);
      qc.invalidateQueries();
    },
    onError: () => webApp()?.HapticFeedback?.notificationOccurred('error'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.replace(/-/g, '').length === 12) claim.mutate();
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-10">
      <p className="ec-kicker text-xs text-brand">Play Stage</p>
      <h1 className="ec-display mt-2 text-2xl text-ink">Привязка анкеты</h1>
      <p className="mt-3 text-sm text-ink-muted">
        {telegramUsername ? `Вы вошли как @${telegramUsername}. ` : ''}
        Введите код, который выдала администрация, — он привяжет вашу анкету к этому
        Telegram-аккаунту.
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <label htmlFor="claim-code" className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Код доступа
        </label>
        <input
          id="claim-code"
          value={code}
          onChange={(e) => setCode(formatCode(e.target.value))}
          placeholder="XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          className="ec-num mt-2 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-center text-lg tracking-[0.2em] text-ink outline-none focus:border-brand"
        />

        {claim.isError && (
          <p className="mt-3 text-sm text-destructive">{claimErrorText(claim.error)}</p>
        )}

        <button
          type="submit"
          disabled={code.replace(/-/g, '').length !== 12 || claim.isPending}
          className="ec-btn ec-btn-dark mt-5 w-full"
        >
          {claim.isPending ? 'Проверяем…' : 'Привязать анкету'}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-line p-4">
        <h2 className="text-sm font-semibold text-ink">Нет кода?</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Коды выдаёт администрация. Напишите организаторам — вам создадут анкету, если её ещё
          нет, и пришлют персональный код.
        </p>
      </div>
    </div>
  );
}
