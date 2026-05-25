# VibeRender — Мастер-бриф для Claude Code

> Вставь весь этот файл в Claude Code как задание. Он самодостаточный:
> описывает контекст, стек, что уже готово и что нужно достроить.

---

## 0. Контекст продукта

VibeRender — децентрализованный DePIN-маркетплейс 3D-рендеринга. Соединяет
**3D-дизайнеров** (загружают .blend/.max-файлы, блокируют оплату в крипто-эскроу)
и **владельцев GPU / геймеров** (рендерят проекты на своих ПК, забирают награду
в USDT/USDC через сети **Base** и **Arbitrum**).

Стадия — MVP/прототип для питча Web3-фондам (Base Builder Grants, Arbitrum,
Gitcoin). Цель сборки — довести фронтенд до Tier-1 production-уровня.

Этот каркас — пересобранная архитектура поверх аудита текущего прототипа. Весь
контент уже перенесён в локали, фундамент (i18n, RTL, glassmorphism-токены,
Web3-каркас) заложен. **Твоя задача — достроить недостающее, не ломая фундамент.**

---

## 1. Зафиксированный стек — НЕ МЕНЯТЬ

React 18 · TypeScript · Vite 5 · Tailwind CSS 3.4 · react-router-dom 6 ·
react-i18next · wagmi 2 + viem 2 + RainbowKit 2 · @tanstack/react-query 5 ·
recharts · react-dropzone · lucide-react · clsx.

Все версии — в `package.json`. Не добавляй UI-китов (Material, Chakra и т.п.) —
дизайн-система проекта строится на Tailwind + собственный `.glass`-токен.

---

## 2. Что УЖЕ есть в каркасе (не переписывать, использовать)

| Файл | Назначение |
|---|---|
| `tailwind.config.ts` | Тема через CSS-переменные, шрифты, анимации |
| `src/index.css` | Дизайн-токены, `.glass`, fluid-типографика, RTL |
| `src/config/chains.ts` | Единственный источник истины по сетям + `CHAIN_LABEL` |
| `src/web3/wagmi.ts` | Конфиг wagmi + RainbowKit (Base, Arbitrum) |
| `src/i18n/index.ts` | Инициализация i18next, список языков |
| `src/i18n/applyDirection.ts` | Переключение `dir=rtl/ltr` на `<html>` |
| `src/i18n/locales/{en,ru,ar}.json` | ВЕСЬ контент сайта, 104 ключа, парность проверена |
| `src/lib/pricing.ts` | Реактивный расчёт цены эскроу (`quote()`, `usdt()`) |
| `src/hooks/useTransactionState.ts` | Машина состояний для on-chain кнопок |
| `src/components/GlassCard.tsx` | Единственный способ рисовать карточку |
| `src/components/JobBoard.tsx` | Адаптивная доска задач (grid + ARIA, без скролла) |
| `src/components/ConnectWalletButton.tsx` | State-aware кнопка кошелька |
| `src/components/LanguageSwitcher.tsx` | Переключатель EN/RU/AR |
| `src/components/Navbar.tsx` | Шапка с бургером ниже `lg` |
| `src/App.tsx`, `src/main.tsx` | Провайдеры (порядок важен), роутинг |
| `src/pages/Home.tsx` | РЕФЕРЕНСНАЯ страница — паттерн для остальных |
| `src/pages/Operators.tsx` | Готова (баланс + JobBoard) |
| `src/pages/Designers.tsx`, `Profile.tsx` | Заготовки с TODO — достроить |

---

## 3. Boilerplate, который нужно доскаффолдить

Каркас НЕ содержит стандартный Vite-бойлерплейт. Создай его сам (это типовой
Vite + React + TS, генерируй по умолчанию):

- `index.html` — с `<div id="root">` и `<script type="module" src="/src/main.tsx">`;
- `vite.config.ts` — с `@vitejs/plugin-react`;
- `tsconfig.json` + `tsconfig.node.json` — strict-режим включён;
- `postcss.config.js` — `tailwindcss` + `autoprefixer`;
- `.gitignore` — node_modules, dist, .env.local;
- ESLint-конфиг (опционально).

Затем: `npm install` и убедись, что `npm run dev` стартует без ошибок.

---

## 4. Порядок сборки — строго по приоритету (из аудита)

### P0 — критическое
1. Доскаффолдить boilerplate (раздел 3), проект должен запускаться.
2. Достроить `Designers.tsx` (раздел 5.2) и `Profile.tsx` (раздел 5.4).
3. Достроить секции `Home.tsx` (раздел 5.1).
4. Проверить, что НИГДЕ нет хардкода названий сетей — только `CHAIN_LABEL`.

### P1 — Tier-1 полировка
5. Прогнать i18n: переключить на RU и AR, убедиться, что нет overflow и RTL
   зеркалится (раздел 7).
6. Свести все карточки к `<GlassCard/>`, проверить консистентность.
7. Контраст текста — WCAG AA (раздел 6).

### P2 — Web3-каркас
8. Подключить реальные хуки wagmi к кнопкам (раздел 8).
9. Заменить мок-данные на чтение с контракта/индексатора там, где возможно.

---

## 5. Спецификация страниц

Общее правило: каждая страница берёт ВЕСЬ текст из `t()`, любую карточку рисует
через `<GlassCard/>`, любую сетку — через `grid-cols-[repeat(auto-fit,minmax(...))]`.
`Home.tsx` — эталон, повторяй его паттерны.

### 5.1. Home — достроить секции
Готово: hero, stats. Достроить по ключам локалей:
- **How It Works** (`howItWorks.*`) — два столбца (designers/operators), в каждом
  3 шага с номером. На мобильном столбцы идут друг под другом.
- **Network Presence** (`network.*`) — заголовок + список/карта городов-нод.
  Желательно SVG-карта мира с анимированными точками (класс `animate-pulse-node`).
- **Features** (`features.*`) — 3 карточки преимуществ, auto-fit grid.
- **FAQ** (`faq.items` — массив `{q, a}`) — аккордеон. ОБЯЗАТЕЛЬНО: `aria-expanded`
  на кнопке, видимый focus-ring, иконка-шеврон с классом `flip-rtl`.

### 5.2. Designers — достроить полностью
1. **Dropzone** — `react-dropzone`. Состояния: `idle` → `drag-over` (рамка
   меняется на `border-accent`, фон подсвечивается) → `uploading` (прогресс) →
   `success` → `error`. Принимать `.blend/.max/.c4d/.zip`, лимит 5 ГБ; при
   нарушении показывать `designers.dropzone.errorFormat` / `errorSize`.
   Обязателен скрытый `<input type="file">` и доступность с клавиатуры.
2. **Render Settings** — селектор Resolution (`1080p/4K/8K`) и Frame Range
   (два числа или слайдер). Ключи `designers.settings.*`.
3. **Escrow-калькулятор** — РЕАКТИВНЫЙ. Бери `quote(resolution, frames)` из
   `src/lib/pricing.ts`. Цена за кадр МЕНЯЕТСЯ при смене разрешения; комиссия
   протокола НЕ нулевая. Все суммы — с классом `nums`. Ключи `designers.calculator.*`.
4. **Кнопка Lock Escrow** — через `useTransactionState`. Это two-tx flow:
   сначала `approve()` ERC-20, потом `deposit()` в эскроу-контракт (раздел 8).

### 5.3. Operators — готово
Проверить, что `JobBoard` корректно схлопывается в одну колонку на мобильном
и что кнопка Withdraw показывает состояние через `useTransactionState`.

### 5.4. Profile — достроить полностью
1. Шапка профиля: аватар-инициалы, имя, роль (`profile.role`), усечённый адрес
   кошелька (формат `0x4f...8a9b`), бейдж сети.
2. 3 карточки метрик (`profile.stats.*`) — auto-fit grid.
3. График **Monthly Activity** — `recharts`, ОБЯЗАТЕЛЬНО внутри
   `<ResponsiveContainer width="100%" height={...}>`, иначе не сожмётся на мобильном.
4. **Settings** — поля (username, email) и тоглы (2FA, hardware wallet, email
   alerts), кнопка Save Changes. Ключи `profile.settings.*`.

---

## 6. Правила дизайн-системы

- **Карточки** — только `<GlassCard/>`. Сырой непрозрачный `<div>` с фоном или
  `<Card>` из shadcn — запрещены (это ломает консистентность glassmorphism).
- **Цвета** — только токены Tailwind: `bg-bg`, `text-fg`, `text-muted`,
  `bg-accent`, `text-accent-2`, `bg-success`, `bg-danger`. Хардкод hex/rgb запрещён.
- **Радиусы** — `rounded-xl`/`rounded-2xl`. Не использовать `rounded-md` и мельче.
- **Заголовки** — класс `h-display` + `text-fluid-hero`/`text-fluid-h2`.
- **Деньги/числа** — всегда класс `nums` (tabular-nums), чтобы цифры не прыгали.
- **Интерактив** — `transition-*` 150–200ms, hover-состояние, видимый
  `:focus-visible` (уже глобально в `index.css` — не отключать).
- **Контраст** — вторичный текст не светлее `text-muted`. Цель: WCAG 2.1 AA
  (≥ 4.5:1 для обычного текста, ≥ 3:1 для крупного).

---

## 7. Правила i18n и RTL

- **Ноль хардкод-строк** в JSX. Любой видимый текст — `t('namespace.key')`.
  Если нужного ключа нет — добавь его СРАЗУ во все три файла `en/ru/ar.json`
  (парность ключей обязательна).
- **Только логические утилиты** Tailwind: `ms-/me-/ps-/pe-/start-/end-`,
  `text-start/text-end`, `rounded-s-/rounded-e-`, `border-s-/border-e-`.
  Физические (`ml-/pl-/left-/text-left`) — запрещены: они не зеркалятся в RTL.
- **Контейнеры flex** с текстом, который может удлиниться: добавляй `min-w-0`
  родителю и `break-words` тексту, иконкам — `shrink-0`. Без `min-w-0` flex-потомок
  выдавливает родителя — это и есть "layout overflow при смене языка".
- **Проверка приёмки**: переключи язык на RU и на AR на КАЖДОЙ странице. Не должно
  быть горизонтального скролла, обрезанного текста, наложений. В AR весь layout
  обязан зеркалиться (меню, иконки, таблица, калькулятор).
- Иконки-стрелки/шевроны в RTL — класс `flip-rtl`.

---

## 8. Правила Web3

Контрактов ещё нет — задача каркаса в готовности к интеграции, не в самих
контрактах.

- **Каждая on-chain кнопка** (`Lock Escrow`, `Withdraw`, `Claim Job`) обёрнута в
  `useTransactionState`. UI читает `status`/`isBusy` и рисует надпись + спиннер +
  тост. Не делай "немых" кнопок.
- **Network guard**: перед on-chain действием проверяй `useChainId()`. Если сеть
  не Base/Arbitrum — кнопка показывает "Switch Network" и зовёт `useSwitchChain`.
  Используй `isSupportedChain()` из `src/config/chains.ts`.
- **Escrow — это two-tx flow**: `approve()` ERC-20 (USDC/USDT) → `deposit()` в
  эскроу-контракт. Кнопка Lock Escrow обязана провести юзера через ОБА шага:
  `useReadContract` на `allowance` → условный `approve` → `useWriteContract` на
  `deposit`. Иначе первая транзакция упадёт.
- **Не хардкодить** балансы и адреса контрактов. Адреса — из `import.meta.env`
  (`VITE_ESCROW_CONTRACT_BASE` и т.д.). Балансы — через `useReadContract`
  (`balanceOf`) или индексатор; пока нет контракта — оставь мок, но за тем же
  хук-интерфейсом.
- **Безопасность**: фронтенд НИКОГДА не доверяет сумме эскроу с клиента (её
  валидирует контракт). Не хранить приватные ключи, не автоподписывать транзакции.

---

## 9. Definition of Done — чеклист приёмки

- [ ] `npm run dev` и `npm run build` проходят без ошибок и варнингов TS.
- [ ] Все 4 страницы достроены по разделу 5.
- [ ] Поиском по `src/` НЕТ хардкод-строк в JSX (всё через `t()`).
- [ ] Поиском по `src/` НЕТ физических утилит отступов (`ml-/mr-/pl-/pr-/left-/right-`).
- [ ] EN/RU/AR: на каждой странице нет overflow и горизонтального скролла.
- [ ] AR: layout полностью зеркалится.
- [ ] Все карточки — `<GlassCard/>`; визуально однородны.
- [ ] Названия сетей везде берутся из `CHAIN_LABEL` (нет "Polygon", "zkSync").
- [ ] Escrow-калькулятор реагирует на разрешение и число кадров; комиссия > 0.
- [ ] Каждая on-chain кнопка имеет состояния через `useTransactionState`.
- [ ] График профиля внутри `<ResponsiveContainer>`.
- [ ] Виден `:focus-visible` на всех интерактивных элементах.
- [ ] Проверено на ширинах 375 / 768 / 1280 px.

---

## 10. Чего НЕ делать

- Не менять стек и не добавлять UI-киты.
- Не трогать токены в `index.css` и логику `chains.ts` / `i18n` / `useTransactionState`
  без явной причины — это фундамент.
- Не вставлять реальные приватные ключи, seed-фразы, секреты в код.
- Не возвращать таблицу из 6 колонок на странице операторов.
- Не использовать `localStorage` для чего-либо, кроме выбора языка.
- Не хардкодить тексты, цвета, названия сетей.
