# IT Passport Priority Trainer (MVP)

スマホ完結で、ITパスポートの頻出分野から学ぶためのMVPです。

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 画面

- `/` ホーム（今日の優先タスク）
- `/quiz` 問題演習（回答保存・解説表示）
- `/analytics` 出題傾向分析
- `/progress` 進捗
- `/settings` 設定（`userId` 保存）

## API

- `GET /api/daily-plan?userId=<uuid>&limit=5`
  - 当日の `daily_plans` があれば優先表示
  - なければ `topic_stats` から動的計算
- `GET /api/questions?topicCode=TEC-NET&limit=10`
  - 問題と選択肢を返却
- `POST /api/attempts`
  - `attempts` に回答保存
  - `topic_stats` を更新
  - 当日の `daily_plans` を再計算

## 優先度ロジック

`priority = frequency * 0.5 + wrongRate * 0.4 + daysSinceLastStudy * 0.1`

## 必須環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## DB

- スキーマ: `supabase/schema.sql`
- 初期データ: `supabase/seed.sql`

## 実データ連携手順

1. Supabaseで `schema.sql` と `seed.sql` を実行
2. `.env.local` に3つのキーを設定
3. `/settings` で `auth.users.id` の `userId` を保存
4. `/quiz` で回答すると学習履歴と計画が更新される
5. `/` で優先順が更新される
