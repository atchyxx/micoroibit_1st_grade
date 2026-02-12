-- Supabase schema for MVP
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  daily_minutes int not null default 20,
  created_at timestamptz not null default now()
);

create table if not exists topics (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  exam_frequency numeric(5,2) not null default 0
);

create table if not exists questions (
  id bigserial primary key,
  topic_id bigint not null references topics(id) on delete restrict,
  body text not null,
  explanation text,
  correct_choice_no int not null check (correct_choice_no between 1 and 4),
  created_at timestamptz not null default now()
);

create table if not exists choices (
  id bigserial primary key,
  question_id bigint not null references questions(id) on delete cascade,
  choice_no int not null check (choice_no between 1 and 4),
  body text not null,
  unique(question_id, choice_no)
);

create table if not exists attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id bigint not null references questions(id) on delete cascade,
  selected_choice_no int not null check (selected_choice_no between 1 and 4),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  elapsed_sec int
);

create table if not exists topic_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id bigint not null references topics(id) on delete cascade,
  total_answers int not null default 0,
  correct_answers int not null default 0,
  accuracy numeric(5,2) not null default 0,
  wrong_rate numeric(5,2) not null default 0,
  last_studied_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id, topic_id)
);

create table if not exists daily_plans (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  topic_id bigint not null references topics(id) on delete cascade,
  priority_score numeric(8,3) not null,
  recommended_questions int not null default 10,
  created_at timestamptz not null default now(),
  unique(user_id, plan_date, topic_id)
);

alter table profiles enable row level security;
alter table attempts enable row level security;
alter table topic_stats enable row level security;
alter table daily_plans enable row level security;

create policy "profiles_owner" on profiles for all using (auth.uid() = user_id);
create policy "attempts_owner" on attempts for all using (auth.uid() = user_id);
create policy "topic_stats_owner" on topic_stats for all using (auth.uid() = user_id);
create policy "daily_plans_owner" on daily_plans for all using (auth.uid() = user_id);
