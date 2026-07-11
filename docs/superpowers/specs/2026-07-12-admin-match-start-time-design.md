# Редактирование времени начала матча в админке

**Дата:** 2026-07-12
**Статус:** утверждён дизайн
**Репозиторий:** OziePozie/DiscordForFemka-Frontend (только фронтенд)

## Задача

Дать администратору/модератору возможность задать/изменить планируемое время
начала матча (`scheduledAt`) прямо из админ-панели. Сейчас это время
показывается в списке матчей (колонка «Время»), но отредактировать его через UI
нельзя.

## Контекст

- Бэкенд уже полностью поддерживает `scheduledAt`:
  - `PATCH /api/v1/admin/matches/{id}` принимает `scheduledAt` в
    `UpdateMatchRequest` и применяет его в `MatchService.update`.
  - Возвращается наружу в `MatchDto.scheduledAt`.
  - **Бэкенд менять не нужно. Миграций нет.**
- Все админ-действия над матчем собраны в дропдауне
  `src/components/MatchAdminMenu.tsx` (пункты «Настройки лобби», «Завершить
  матч», «Техвин/техлуз», «Переставить команды», «Изменить формат серии» и
  др.). Компонент рендерится и на `AdminMatchesPage`, и на
  `TournamentDetailsPage` — новое действие автоматически появится на обеих
  страницах.
- Мутация `useUpdateAdminMatch` (`src/lib/queries.ts`) — это тот же PATCH; уже
  используется для настроек лобби и сброса готовности.
- Готовые хелперы в `src/lib/utils.ts`:
  - `formatDateTimeLocal(iso)` — ISO-UTC → значение для
    `<input type="datetime-local">` (локальная TZ, точность до минут).
  - `parseLocalDateTime(local)` — значение `datetime-local` → ISO-UTC (или
    `null`, если пусто/невалидно).

## Ограничение бэкенда (важно)

`MatchService.update` применяет `scheduledAt`, только если он **не `null`**
(`if (req.scheduledAt() != null) m.setScheduledAt(...)`). Значит **очистить**
время через этот PATCH невозможно — отправка `null`/пустого значения будет
молчаливым no-op.

Вывод для UI: диалог позволяет только **задать или изменить** время, но не
стереть его. Стирание — отдельная будущая доработка бэка, в этот объём не
входит.

## Дизайн (подход А: отдельный пункт меню + диалог)

### 1. Тип запроса

В рукописный интерфейс `UpdateMatchRequest` (`src/lib/api/types.ts`, ~строка
184) добавить поле:

```ts
scheduledAt?: string | null;
```

Сейчас поля там нет — без него PATCH со временем не пройдёт проверку типов
TypeScript.

### 2. Пункт меню

В `MatchAdminMenu.tsx`, в блоке действий `!finished` (т.е. для статусов
SCHEDULED/LIVE, но не для FINISHED/CANCELLED), добавить пункт
**«Изменить время начала»**. Размещение — рядом с «Настройки лобби».

### 3. Состояние и диалог

- Расширить тип `DialogState` вариантом `{ kind: 'schedule' }`.
- Локальный стейт `const [scheduleValue, setScheduleValue] = useState<string>('')`
  (значение `datetime-local`).
- При открытии пункта: `setScheduleValue(formatDateTimeLocal(match.scheduledAt))`,
  затем `setDialog({ kind: 'schedule' })`.
- Диалог (в стиле остальных `Dialog` в этом файле):
  - Заголовок: «Время начала матча».
  - Описание: `${teamName(match.teamA)} vs ${teamName(match.teamB)}`.
  - Один `<input type="datetime-local">`, управляемый `scheduleValue`,
    оформленный так же, как числовые инпуты в диалоге «Завершить матч»
    (класс `h-9 w-full rounded-md border border-input bg-background px-3
    text-sm`), с `<Label>`.
  - Подсказка мелким текстом: время в вашем часовом поясе; очистить нельзя,
    только задать/изменить.
  - Кнопки: «Отмена» (ghost) и «Сохранить». Кнопка «Сохранить» задизейблена,
    если `mutating` **или** поле пустое (`!scheduleValue`) — так мы не
    отправляем молчаливый no-op.

### 4. Обработчик сохранения

```ts
async function handleSchedule() {
  if (!dialog || dialog.kind !== 'schedule') return;
  const scheduledAt = parseLocalDateTime(scheduleValue);
  if (!scheduledAt) return; // пусто/невалидно — Save и так задизейблен
  try {
    await updateMut.mutateAsync({ id: match.id, patch: { scheduledAt } });
    toast({ title: 'Время начала обновлено' });
    await refetchMatches();
    closeDialog();
  } catch (e) {
    toast({
      title: 'Не удалось обновить время',
      description: describeError(e),
      variant: 'destructive',
    });
  }
}
```

Инвалидация: `refetchMatches()` (как в остальных обработчиках) плюс встроенная в
`useUpdateAdminMatch` инвалидация `match`/`tournament`.

## Что НЕ делаем

- Не трогаем бэкенд и БД.
- Не добавляем возможность стереть время (ограничение бэка выше).
- Не добавляем UI создания матча (матчи создаются из сетки, отдельного
  create-экрана в админке нет).
- Не делаем инлайн-редактирование в таблице.

## Затронутые файлы

- `src/lib/api/types.ts` — добавить `scheduledAt` в `UpdateMatchRequest`.
- `src/components/MatchAdminMenu.tsx` — пункт меню + диалог + обработчик.

## Проверка

- `npm run build` / `tsc` проходит (тип `UpdateMatchRequest` расширен).
- Ручная проверка в dev против прод-API: открыть админку → матч в статусе
  «Запланирован» → «Изменить время начала» → задать время → в списке колонка
  «Время» обновилась.
