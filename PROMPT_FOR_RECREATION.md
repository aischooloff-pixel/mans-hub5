# Промпт для воссоздания проекта AI School Off

Этот промпт позволяет другой нейросети (Claude, GPT, Lovable и т.д.) воссоздать проект с нуля на том же этапе разработки.

---

## 🎯 Главный промпт

```
Создай Telegram Mini App для публикации статей с модерацией и системой репутации.

## Технологии

Frontend:
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router для маршрутизации
- TanStack Query для серверного состояния

Backend (Lovable Cloud / Supabase):
- PostgreSQL база данных
- Edge Functions на Deno
- Row Level Security (RLS)
- Telegram Bot API для модерации

## Особенности аутентификации

ВАЖНО: Используется Telegram WebApp аутентификация, НЕ Supabase Auth!

- Пользователи идентифицируются по telegram_id
- initData получается из window.Telegram.WebApp.initData
- Валидация initData происходит на бэкенде через HMAC-SHA256
- Все операции с БД выполняются через service_role key

## База данных

Создай следующие таблицы:

### profiles
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE,
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  avatar_url text,
  reputation integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  telegram_channel text,
  website text,
  show_avatar boolean NOT NULL DEFAULT true,
  show_name boolean NOT NULL DEFAULT true,
  show_username boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Профили видны всем
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Вставка/обновление через service_role
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update profiles" ON profiles
  FOR UPDATE USING (true) WITH CHECK (true);
```

### articles
```sql
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id),
  category_id text,
  title text NOT NULL,
  preview text,
  body text NOT NULL,
  media_url text,
  media_type text, -- 'image' | 'youtube'
  is_anonymous boolean DEFAULT false,
  allow_comments boolean DEFAULT true,
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  rep_score integer DEFAULT 0,
  telegram_message_id bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Одобренные статьи видны всем
CREATE POLICY "Approved articles are viewable by everyone" ON articles
  FOR SELECT USING (status = 'approved');

-- Service role для записи
CREATE POLICY "Service role can insert articles" ON articles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update articles" ON articles
  FOR UPDATE USING (true) WITH CHECK (true);
```

### reputation_history
```sql
CREATE TABLE reputation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  from_user_id uuid REFERENCES profiles(id),
  article_id uuid REFERENCES articles(id),
  value integer NOT NULL, -- +10 за одобрение, +1/-1 за лайки
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON reputation_history
  FOR ALL USING (true) WITH CHECK (true);
```

### moderation_logs
```sql
CREATE TABLE moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id),
  moderator_telegram_id bigint NOT NULL,
  action varchar NOT NULL, -- 'approved' | 'rejected'
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON moderation_logs
  FOR ALL USING (false);
```

### moderation_short_ids
```sql
-- Короткие ID для callback_data (макс 64 байта)
CREATE TABLE moderation_short_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id varchar NOT NULL UNIQUE,
  article_id uuid NOT NULL REFERENCES articles(id),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE moderation_short_ids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON moderation_short_ids
  FOR ALL USING (false);
```

### pending_rejections
```sql
-- Временное хранение для ожидания причины отклонения
CREATE TABLE pending_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id varchar NOT NULL,
  article_id uuid NOT NULL REFERENCES articles(id),
  admin_telegram_id bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pending_rejections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON pending_rejections
  FOR ALL USING (false);
```

### support_questions
```sql
CREATE TABLE support_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_telegram_id bigint NOT NULL,
  user_profile_id uuid REFERENCES profiles(id),
  question text NOT NULL,
  answer text,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'answered'
  admin_message_id bigint,
  answered_by_telegram_id bigint,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON support_questions
  FOR ALL USING (false) WITH CHECK (true);
```

### user_roles
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Функция проверки роли (SECURITY DEFINER для избежания рекурсии)
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### admin_settings
```sql
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access settings" ON admin_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### Database Functions
```sql
-- Генерация 6-символьного ID
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Получить или создать short_id для статьи
CREATE OR REPLACE FUNCTION get_or_create_short_id(p_article_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_short_id TEXT;
BEGIN
  SELECT short_id INTO v_short_id FROM moderation_short_ids WHERE article_id = p_article_id;
  
  IF v_short_id IS NOT NULL THEN
    RETURN v_short_id;
  END IF;
  
  LOOP
    v_short_id := generate_short_id();
    BEGIN
      INSERT INTO moderation_short_ids (short_id, article_id) VALUES (v_short_id, p_article_id);
      RETURN v_short_id;
    EXCEPTION WHEN unique_violation THEN
      -- Try again
    END;
  END LOOP;
END;
$$;

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

## Edge Functions

Создай следующие Edge Functions:

### 1. tg-sync-profile
Синхронизация профиля из Telegram:
- Принимает { initData: string }
- Валидирует initData через HMAC-SHA256 с TELEGRAM_BOT_TOKEN
- Upsert профиля по telegram_id
- Возвращает { profile, articlesCount }

### 2. tg-create-article
Создание статьи:
- Принимает { initData, article: { title, body, category_id, is_anonymous, allow_comments, media_url } }
- Валидирует initData
- Создаёт статью со статусом 'pending'
- Возвращает { article }

### 3. send-moderation
Отправка на модерацию:
- Принимает { articleId }
- Генерирует short_id
- Отправляет сообщение в админ чат через ADMIN_BOT_TOKEN
- С inline кнопками: ✅ Принять | ❌ Отклонить

### 4. tg-my-articles
Получение статей пользователя:
- Принимает { initData }
- Возвращает { articles: [] }

### 5. tg-my-reputation
Получение истории репутации:
- Принимает { initData }
- Возвращает { history: [], total: number }

### 6. tg-update-privacy
Обновление настроек приватности:
- Принимает { initData, show_avatar, show_name, show_username }
- Возвращает { profile }

### 7. telegram-bot (Webhook)
Основной бот для пользователей:
- /start — приветствие, создание профиля
- /start support — режим поддержки
- Обработка текста в режиме поддержки
- Callback queries для модерации

### 8. admin-bot (Webhook)
Админ бот:
- /start — приветствие
- /stats — статистика
- /pending — статьи на модерации
- /questions — вопросы поддержки
- /broadcast <text> — рассылка
- Callback queries: approve:<short_id>, reject:<short_id>
- Reply на вопросы → ответ пользователю

## Frontend структура

### Страницы:
- / — главная (статьи, подкасты, категории)
- /hub — хаб статей
- /profile — профиль пользователя
- /admin — админ панель
- /admin-auth — авторизация админа

### Хуки:
- use-telegram.ts — работа с Telegram WebApp API
- use-profile.ts — синхронизация профиля
- use-articles.ts — CRUD статей
- use-reputation.ts — репутация

### Ключевые компоненты:
- Header с поиском и уведомлениями
- BottomNav с навигацией
- ArticleCard для отображения статей
- CreateArticleModal для создания статей
- ProfileModal с настройками

## Требуемые секреты

- TELEGRAM_BOT_TOKEN — токен основного бота
- ADMIN_BOT_TOKEN — токен админ бота  
- TELEGRAM_ADMIN_CHAT_ID — ID чата для модерации

## Важные особенности

1. Два бота: USER_BOT для пользователей, ADMIN_BOT для модерации
2. initData доступен только при открытии через Telegram
3. Short ID для callback_data (ограничение 64 байта)
4. Все записи в БД через service_role
5. Уведомления пользователям через USER_BOT
6. Модерация через ADMIN_BOT
```

---

## 📋 Чек-лист для проверки воссоздания

После генерации проверь:

- [ ] Все таблицы созданы с правильными полями
- [ ] RLS политики применены
- [ ] Database functions работают
- [ ] Edge functions деплоятся без ошибок
- [ ] Валидация initData работает
- [ ] Профили синхронизируются при открытии через Telegram
- [ ] Статьи создаются и отправляются на модерацию
- [ ] Кнопки Принять/Отклонить работают в админ чате
- [ ] Уведомления приходят авторам
- [ ] Поддержка через /start support работает

---

## 🔧 Дополнительные инструкции

### Для настройки ботов:

1. Создай два бота через @BotFather
2. Включи Inline Mode для обоих
3. Добавь Admin бота в группу модерации
4. Получи Chat ID группы
5. Установи webhooks на Edge Functions

### Для тестирования:

1. Открой Mini App через бота
2. Проверь синхронизацию профиля
3. Создай тестовую статью
4. Проверь получение в админ чате
5. Одобри/отклони статью
6. Проверь уведомление автору

---

## 📌 Этап разработки

Текущий этап: **MVP v1.0**

Реализовано:
- ✅ Регистрация/авторизация через Telegram
- ✅ Профили с настройками приватности
- ✅ Создание статей
- ✅ Модерация через Telegram
- ✅ Уведомления авторам
- ✅ Поддержка пользователей
- ✅ Админ панель с командами
- ✅ Система репутации (базовая)

Не реализовано:
- ❌ Редактирование статей
- ❌ Комментарии
- ❌ Лайки/дизлайки
- ❌ Избранное
- ❌ Dev-режим для тестирования без Telegram
- ❌ Push-уведомления
