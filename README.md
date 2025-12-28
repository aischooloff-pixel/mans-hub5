# AI School Off — Telegram Mini App

Telegram Mini App для публикации статей с системой репутации, модерацией и профилями пользователей.

---

## 📋 Оглавление

1. [Технологический стек](#-технологический-стек)
2. [Структура проекта](#-структура-проекта)
3. [База данных](#-база-данных)
4. [Edge Functions (API)](#-edge-functions-api)
5. [Аутентификация](#-аутентификация)
6. [Бизнес-логика](#-бизнес-логика)
7. [Известные проблемы](#-известные-проблемы)
8. [Секреты](#-секреты)
9. [Запуск](#-запуск)

---

## 🏗️ Технологический стек

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.x | UI фреймворк |
| TypeScript | 5.x | Типизация |
| Vite | 5.x | Сборщик |
| Tailwind CSS | 3.x | Стилизация |
| shadcn/ui | latest | UI компоненты |
| TanStack Query | 5.x | Управление состоянием сервера |
| React Router | 6.x | Маршрутизация |

### Backend (Lovable Cloud / Supabase)
| Технология | Назначение |
|------------|------------|
| PostgreSQL | База данных |
| Edge Functions (Deno) | Серверная логика |
| Row Level Security (RLS) | Безопасность данных |
| Telegram Bot API | Уведомления и модерация |

---

## 📁 Структура проекта

```
src/
├── components/
│   ├── articles/           # Компоненты статей
│   │   ├── ArticleCard.tsx         # Карточка статьи
│   │   ├── ArticleCarousel.tsx     # Карусель статей
│   │   ├── ArticleListCard.tsx     # Элемент списка статей
│   │   ├── AllArticlesModal.tsx    # Модал всех статей
│   │   └── CreateArticleModal.tsx  # Модал создания статьи
│   ├── categories/         # Категории
│   │   └── CategoryList.tsx        # Список категорий
│   ├── cta/                # Call-to-action
│   │   └── TelegramCTA.tsx         # CTA для Telegram
│   ├── header/             # Шапка
│   │   ├── Header.tsx              # Основной header
│   │   ├── SearchModal.tsx         # Модал поиска
│   │   ├── NotificationsModal.tsx  # Уведомления
│   │   └── SideMenu.tsx            # Боковое меню
│   ├── layout/             # Layout компоненты
│   │   ├── BottomNav.tsx           # Нижняя навигация
│   │   └── Header.tsx              # Шапка
│   ├── podcasts/           # Подкасты
│   │   ├── PodcastCard.tsx         # Карточка подкаста
│   │   ├── PodcastCarousel.tsx     # Карусель подкастов
│   │   └── PodcastPlayerModal.tsx  # Плеер подкаста
│   ├── premium/            # Premium функции
│   │   └── PremiumBanner.tsx       # Баннер Premium
│   ├── profile/            # Профиль пользователя
│   │   ├── ProfileModal.tsx        # Модал профиля
│   │   ├── PremiumModal.tsx        # Модал подписки
│   │   ├── SettingsModal.tsx       # Настройки
│   │   ├── SocialLinksModal.tsx    # Соц. ссылки
│   │   ├── UserArticlesModal.tsx   # Статьи пользователя
│   │   └── ReputationHistoryModal.tsx # История репутации
│   ├── ui/                 # shadcn/ui компоненты
│   └── welcome/            # Приветственный модал
│       └── WelcomeModal.tsx
├── hooks/
│   ├── use-articles.ts     # Хук для статей (CRUD)
│   ├── use-profile.ts      # Хук для профиля (sync, privacy)
│   ├── use-reputation.ts   # Хук для репутации
│   ├── use-telegram.ts     # Хук для Telegram WebApp API
│   └── use-mobile.tsx      # Определение мобильного устройства
├── pages/
│   ├── Index.tsx           # Главная страница
│   ├── Hub.tsx             # Хаб статей
│   ├── Profile.tsx         # Страница профиля
│   ├── Admin.tsx           # Админ панель
│   ├── AdminAuth.tsx       # Авторизация админа
│   └── NotFound.tsx        # 404 страница
├── data/
│   └── mockData.ts         # Моковые данные (категории, подкасты)
├── types/
│   └── index.ts            # TypeScript типы
└── integrations/
    └── supabase/
        ├── client.ts       # Supabase клиент (авто-генерируется)
        └── types.ts        # Типы БД (авто-генерируется)

supabase/
└── functions/
    ├── telegram-bot/       # Основной бот (webhook)
    ├── admin-bot/          # Админ бот (webhook)
    ├── tg-create-article/  # Создание статьи
    ├── tg-my-articles/     # Получение статей пользователя
    ├── tg-my-reputation/   # Получение репутации
    ├── tg-sync-profile/    # Синхронизация профиля
    ├── tg-update-privacy/  # Обновление настроек приватности
    └── send-moderation/    # Отправка статьи на модерацию
```

---

## 🗄️ База данных

### Схема таблиц

#### `profiles` — Профили пользователей
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| telegram_id | bigint | Yes | - | Telegram ID пользователя |
| user_id | uuid | Yes | - | Связь с auth.users (не используется) |
| username | text | Yes | - | @username в Telegram |
| first_name | text | Yes | - | Имя |
| last_name | text | Yes | - | Фамилия |
| avatar_url | text | Yes | - | URL аватара |
| reputation | integer | Yes | 0 | Репутация |
| is_premium | boolean | Yes | false | Premium статус |
| telegram_channel | text | Yes | - | Ссылка на канал |
| website | text | Yes | - | Сайт |
| show_avatar | boolean | No | true | Показывать аватар |
| show_name | boolean | No | true | Показывать имя |
| show_username | boolean | No | true | Показывать username |
| created_at | timestamptz | Yes | now() | Дата создания |
| updated_at | timestamptz | Yes | now() | Дата обновления |

**RLS политики:**
- `Profiles are viewable by everyone` — SELECT для всех
- `Service role can insert profiles` — INSERT через service_role
- `Service role can update profiles` — UPDATE через service_role

---

#### `articles` — Статьи
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| author_id | uuid | Yes | - | FK → profiles.id |
| category_id | text | Yes | - | ID категории |
| title | text | No | - | Заголовок |
| preview | text | Yes | - | Превью (до 200 символов) |
| body | text | No | - | Полный текст |
| media_url | text | Yes | - | URL медиа |
| media_type | text | Yes | - | Тип: image/youtube |
| is_anonymous | boolean | Yes | false | Анонимная публикация |
| allow_comments | boolean | Yes | true | Разрешить комментарии |
| status | text | Yes | 'pending' | pending/approved/rejected |
| rejection_reason | text | Yes | - | Причина отклонения |
| likes_count | integer | Yes | 0 | Лайки |
| comments_count | integer | Yes | 0 | Комментарии |
| favorites_count | integer | Yes | 0 | В избранном |
| rep_score | integer | Yes | 0 | Очки репутации |
| telegram_message_id | bigint | Yes | - | ID сообщения модерации |
| created_at | timestamptz | Yes | now() | Дата создания |
| updated_at | timestamptz | Yes | now() | Дата обновления |

**RLS политики:**
- `Approved articles are viewable by everyone` — SELECT где status='approved'
- `Admins can view all articles` — SELECT для админов
- `Admins can update any article` — UPDATE для админов
- `Service role can insert articles` — INSERT через service_role
- `Service role can update articles` — UPDATE через service_role

---

#### `reputation_history` — История репутации
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | Yes | - | FK → profiles.id (получатель) |
| from_user_id | uuid | Yes | - | FK → profiles.id (отправитель) |
| article_id | uuid | Yes | - | FK → articles.id |
| value | integer | No | - | Значение (+1/-1/+10 и т.д.) |
| created_at | timestamptz | Yes | now() | Дата |

**RLS политики:**
- `Service role only` — ALL через service_role

---

#### `moderation_logs` — Логи модерации
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| article_id | uuid | No | - | FK → articles.id |
| moderator_telegram_id | bigint | No | - | Telegram ID модератора |
| action | varchar | No | - | approved/rejected |
| reason | text | Yes | - | Причина (для reject) |
| created_at | timestamptz | Yes | now() | Дата |

---

#### `moderation_short_ids` — Короткие ID для модерации
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| short_id | varchar | No | - | 6-символьный короткий ID |
| article_id | uuid | No | - | FK → articles.id |
| expires_at | timestamptz | Yes | now() + 7 days | Срок действия |
| created_at | timestamptz | Yes | now() | Дата создания |

---

#### `pending_rejections` — Ожидающие отклонения
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| short_id | varchar | No | - | Короткий ID статьи |
| article_id | uuid | No | - | FK → articles.id |
| admin_telegram_id | bigint | No | - | Telegram ID админа |
| created_at | timestamptz | Yes | now() | Дата |

---

#### `support_questions` — Вопросы в поддержку
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_telegram_id | bigint | No | - | Telegram ID пользователя |
| user_profile_id | uuid | Yes | - | FK → profiles.id |
| question | text | No | - | Текст вопроса |
| answer | text | Yes | - | Ответ |
| status | text | No | 'pending' | pending/answered |
| admin_message_id | bigint | Yes | - | ID сообщения в админ чате |
| answered_by_telegram_id | bigint | Yes | - | Кто ответил |
| answered_at | timestamptz | Yes | - | Когда ответили |
| created_at | timestamptz | No | now() | Дата создания |

---

#### `user_roles` — Роли пользователей
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | No | - | FK → auth.users |
| role | app_role | No | - | admin/moderator/user |
| created_at | timestamptz | Yes | now() | Дата |

**Enum `app_role`:** `'admin' | 'moderator' | 'user'`

---

#### `admin_settings` — Настройки админа
| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | No | gen_random_uuid() | PK |
| key | text | No | - | Ключ настройки |
| value | text | Yes | - | Значение |
| created_at | timestamptz | Yes | now() | Дата создания |
| updated_at | timestamptz | Yes | now() | Дата обновления |

---

### Database Functions

```sql
-- Генерация 6-символьного short_id
generate_short_id() → text

-- Получить или создать short_id для статьи
get_or_create_short_id(p_article_id uuid) → text

-- Проверка роли пользователя
has_role(_user_id uuid, _role app_role) → boolean

-- Автообновление updated_at
update_updated_at_column() → trigger
```

---

## 🔌 Edge Functions (API)

### `tg-sync-profile`
**Назначение:** Синхронизация профиля из Telegram

**Запрос:**
```json
{
  "initData": "query_id=...&user={...}&auth_date=...&hash=..."
}
```

**Логика:**
1. Парсинг и валидация `initData` (HMAC-SHA256)
2. Извлечение Telegram user из initData
3. Upsert профиля в `profiles` по `telegram_id`
4. Подсчёт репутации из `reputation_history`
5. Подсчёт статей пользователя

**Ответ:**
```json
{
  "profile": { ... },
  "articlesCount": 5
}
```

---

### `tg-create-article`
**Назначение:** Создание новой статьи

**Запрос:**
```json
{
  "initData": "...",
  "article": {
    "title": "Заголовок",
    "body": "Текст статьи",
    "category_id": "tech",
    "is_anonymous": false,
    "allow_comments": true,
    "media_url": "https://...",
    "media_type": "image"
  }
}
```

**Логика:**
1. Валидация initData
2. Поиск профиля по telegram_id
3. Генерация preview (первые 200 символов body)
4. Определение media_type (youtube/image)
5. Insert в `articles` со статусом `pending`

**Ответ:**
```json
{
  "article": { ... }
}
```

---

### `send-moderation`
**Назначение:** Отправка статьи на модерацию в Telegram чат

**Запрос:**
```json
{
  "articleId": "uuid"
}
```

**Логика:**
1. Получение статьи с автором
2. Генерация short_id через `get_or_create_short_id`
3. Формирование сообщения с кнопками Принять/Отклонить
4. Отправка в `TELEGRAM_ADMIN_CHAT_ID` через `ADMIN_BOT_TOKEN`
5. Сохранение `telegram_message_id` в статье

---

### `tg-my-articles`
**Назначение:** Получение статей пользователя

**Запрос:**
```json
{
  "initData": "..."
}
```

**Ответ:**
```json
{
  "articles": [...]
}
```

---

### `tg-my-reputation`
**Назначение:** Получение истории репутации

**Запрос:**
```json
{
  "initData": "..."
}
```

**Ответ:**
```json
{
  "history": [...],
  "total": 150
}
```

---

### `tg-update-privacy`
**Назначение:** Обновление настроек приватности

**Запрос:**
```json
{
  "initData": "...",
  "show_avatar": true,
  "show_name": false,
  "show_username": true
}
```

---

### `telegram-bot` (Webhook)
**Назначение:** Основной бот для пользователей

**Обрабатывает:**
- `/start` — приветствие, создание профиля
- `/start support` — режим поддержки
- Текстовые сообщения в режиме поддержки
- Callback queries для модерации (approve/reject)

---

### `admin-bot` (Webhook)
**Назначение:** Админ бот для модерации

**Команды:**
- `/start` — приветствие
- `/stats` — статистика (пользователи, статьи)
- `/pending` — статьи на модерации
- `/questions` — вопросы в поддержку
- `/broadcast <text>` — рассылка всем пользователям
- `/help` — справка

**Callback queries:**
- `approve:<short_id>` — одобрить статью
- `reject:<short_id>` — отклонить статью (запрос причины)

**Reply на вопросы:**
- Ответ на сообщение с вопросом → отправка ответа пользователю

---

## 🔐 Аутентификация

### Telegram WebApp Authentication

**ВАЖНО:** Приложение использует Telegram WebApp аутентификацию, НЕ Supabase Auth.

#### Поток авторизации:

```
1. Пользователь открывает Mini App через бота
                    ↓
2. Telegram WebApp предоставляет initData
                    ↓
3. Frontend получает initData через window.Telegram.WebApp.initData
                    ↓
4. Frontend отправляет initData в Edge Function
                    ↓
5. Backend валидирует initData (HMAC-SHA256)
                    ↓
6. Backend извлекает user из initData
                    ↓
7. Backend ищет/создаёт профиль по telegram_id
```

#### Валидация initData (Backend):

```typescript
async function verifyTelegramInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  
  // Собираем data_check_string
  const pairs = [];
  params.forEach((value, key) => {
    if (key !== 'hash') pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');
  
  // HMAC-SHA256
  const secretKey = await sha256(TELEGRAM_BOT_TOKEN);
  const checkHash = await hmacSha256(secretKey, dataCheckString);
  
  if (checkHash !== hash) return null;
  
  return JSON.parse(params.get('user'));
}
```

#### Структура initData:

```
query_id=AAF...
user={"id":123456789,"first_name":"John","last_name":"Doe","username":"johndoe","language_code":"ru","is_premium":true}
auth_date=1234567890
hash=abc123...
```

---

## 📋 Бизнес-логика

### Создание статьи

```
1. Пользователь заполняет форму
                    ↓
2. Frontend вызывает tg-create-article с initData
                    ↓
3. Backend валидирует, создаёт статью (status: pending)
                    ↓
4. Frontend вызывает send-moderation
                    ↓
5. Backend отправляет в админ чат через ADMIN_BOT
                    ↓
6. Админ нажимает Принять/Отклонить
                    ↓
7. admin-bot обрабатывает callback
                    ↓
8. Статус обновляется, автор получает уведомление через USER_BOT
```

### Модерация через Short ID

Telegram callback_data ограничен 64 байтами. UUID слишком длинный.

**Решение:**
- Генерируется 6-символьный `short_id`
- Хранится в `moderation_short_ids`
- В callback_data передаётся `approve:abc123` или `reject:abc123`
- При обработке short_id конвертируется обратно в article_id

### Система репутации

```
+10 — статья одобрена
+1  — лайк на статью
-1  — дизлайк
```

Репутация считается как SUM(value) из `reputation_history`.

### Поддержка пользователей

```
1. Пользователь: /start support → режим поддержки
                    ↓
2. Пользователь пишет вопрос
                    ↓
3. telegram-bot сохраняет в support_questions
                    ↓
4. Уведомление в админ чат через ADMIN_BOT
                    ↓
5. Админ отвечает reply на сообщение
                    ↓
6. admin-bot ищет вопрос по admin_message_id
                    ↓
7. Ответ отправляется пользователю через USER_BOT
```

---

## ⚠️ Известные проблемы

### 1. Требуется открытие через Telegram

**Проблема:** При открытии напрямую в браузере `initData` пустой.

**Следствия:**
- Профиль не синхронизируется
- Создание статей недоступно ("Unauthorized")
- Ошибка: "Нет данных Telegram (initData)"

**Решение:** Всегда открывать через Telegram бота.

### 2. Два бота

Используются ДВА разных бота:
- **USER_BOT** (`TELEGRAM_BOT_TOKEN`) — для пользователей
- **ADMIN_BOT** (`ADMIN_BOT_TOKEN`) — для модерации

Уведомления пользователям отправляются через USER_BOT.
Модерация происходит через ADMIN_BOT.

### 3. RLS и Service Role

Большинство операций с БД выполняются через `service_role` key, т.к. нет Supabase Auth. RLS политики настроены для:
- Публичного чтения одобренных статей
- Публичного чтения профилей
- Записи только через service_role

---

## 🔑 Секреты

| Секрет | Описание | Где используется |
|--------|----------|------------------|
| `TELEGRAM_BOT_TOKEN` | Токен основного бота | telegram-bot, tg-sync-profile, tg-create-article и др. |
| `ADMIN_BOT_TOKEN` | Токен админ бота | admin-bot, send-moderation |
| `TELEGRAM_ADMIN_CHAT_ID` | ID чата для модерации | telegram-bot, admin-bot, send-moderation |
| `SUPABASE_URL` | URL Supabase | Все edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Все edge functions |

---

## 🚀 Запуск

### Разработка

```bash
npm install
npm run dev
```

### Требования

- Node.js 18+
- Lovable Cloud (Supabase)
- Два Telegram бота (основной + админ)
- Настроенные webhooks для ботов

### Настройка webhooks

```bash
# Основной бот
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<project-id>.supabase.co/functions/v1/telegram-bot"}'

# Админ бот
curl -X POST "https://api.telegram.org/bot<ADMIN_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<project-id>.supabase.co/functions/v1/admin-bot"}'
```

---

## 📝 История изменений

### v1.0.0 (Текущая)
- ✅ Базовая структура приложения
- ✅ Система профилей с синхронизацией из Telegram
- ✅ Создание и модерация статей
- ✅ Система репутации
- ✅ Настройки приватности
- ✅ Админ панель
- ✅ Telegram боты (основной + админ)
- ✅ Поддержка пользователей через бота

### Исправленные баги
- ✅ TS1128 в use-reputation.ts (дублированный return)
- ✅ Улучшена обработка ошибок Edge Functions

### TODO
- ⏳ Режим разработки для тестирования без Telegram
- ⏳ Редактирование статей
- ⏳ Комментарии к статьям
- ⏳ Лайки/дизлайки
- ⏳ Избранное

---

## 📚 Полезные ссылки

- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
