-- Supabase schema for "مشاور ولیزاده" (PostgreSQL)
-- اجرا در SQL Editor داخل Supabase (public schema)

-- ---------- Profiles ----------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','student')),
  name text not null,
  email text not null,
  major text null,
  grade text null,
  phone text null,
  national_id text null,
  address text null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: admin check based on profiles.role
-- IMPORTANT: must be created AFTER profiles exists.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  -- Students can only create their own profile as 'student'
  with check (auth.uid() = user_id and role = 'student');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  using (auth.uid() = user_id or public.is_admin())
  -- Students can only keep role='student'. Admin can update anything.
  with check (
    (auth.uid() = user_id and role = 'student')
    or public.is_admin()
  );

-- ---------- Notes (Shop) ----------
create table if not exists public.notes (
  id text primary key,
  title text not null,
  price integer not null,
  description text not null,
  tags text[] not null default '{}',
  "coverEmoji" text null,
  "imageUrls" text[] null default '{}',
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "notes_select_public" on public.notes;
create policy "notes_select_public" on public.notes
  for select
  using (true);

drop policy if exists "notes_admin_write" on public.notes;
create policy "notes_admin_write" on public.notes
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Orders ----------
create table if not exists public.orders (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  total integer not null,
  status text not null,
  customer jsonb not null,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create index if not exists orders_user_id_idx on public.orders ("userId");

alter table public.orders enable row level security;

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select
  using (auth.uid() = "userId" or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert
  with check (auth.uid() = "userId");

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete
  using (public.is_admin());

-- ---------- Work Reports ----------
create table if not exists public.work_reports (
  id text primary key,
  "userId" uuid not null references auth.users(id) on delete cascade,
  title text null,
  note text null,
  "imageUrls" text[] not null default '{}',
  "createdAt" timestamptz not null,
  status text not null,
  "adminComment" text null,
  "reviewedAt" timestamptz null
);

create index if not exists work_reports_user_id_idx on public.work_reports ("userId");

alter table public.work_reports enable row level security;

drop policy if exists "wr_select_own_or_admin" on public.work_reports;
create policy "wr_select_own_or_admin" on public.work_reports
  for select
  using (auth.uid() = "userId" or public.is_admin());

drop policy if exists "wr_insert_own" on public.work_reports;
create policy "wr_insert_own" on public.work_reports
  for insert
  with check (auth.uid() = "userId");

drop policy if exists "wr_update_admin" on public.work_reports;
create policy "wr_update_admin" on public.work_reports
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Questions ----------
create table if not exists public.questions (
  id text primary key,
  prompt text not null,
  options jsonb not null,
  "correctIndex" integer not null check ("correctIndex" between 0 and 3),
  subject text not null,
  "lessonCode" text not null,
  major text not null,
  difficulty text not null,
  tags text[] not null default '{}',
  "imageUrl" text null,
  "imageFileName" text null
);

alter table public.questions enable row level security;

drop policy if exists "questions_select_auth" on public.questions;
create policy "questions_select_auth" on public.questions
  for select
  using (auth.role() = 'authenticated' or public.is_admin());

drop policy if exists "questions_admin_write" on public.questions;
create policy "questions_admin_write" on public.questions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Exams ----------
create table if not exists public.exams (
  id text primary key,
  title text not null,
  description text not null,
  "durationMinutes" integer not null,
  "questionIds" text[] not null default '{}',
  blueprint jsonb null,
  "negativeMarking" jsonb null,
  "assignedUserIds" uuid[] not null default '{}',
  published boolean not null default true,
  "createdAt" timestamptz not null
);

create index if not exists exams_created_at_idx on public.exams ("createdAt");

alter table public.exams enable row level security;

drop policy if exists "exams_select_students" on public.exams;
create policy "exams_select_students" on public.exams
  for select
  using (
    public.is_admin()
    or (
      published = true
      and (
        array_length("assignedUserIds", 1) is null
        or array_length("assignedUserIds", 1) = 0
        or auth.uid() = any("assignedUserIds")
      )
    )
  );

drop policy if exists "exams_admin_write" on public.exams;
create policy "exams_admin_write" on public.exams
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Attempts ----------
create table if not exists public.attempts (
  id text primary key,
  "examId" text not null references public.exams(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  "startedAt" timestamptz not null,
  "endedAt" timestamptz not null,
  percent integer not null,
  correct integer not null,
  wrong integer not null,
  blank integer not null,
  penalty integer not null,
  "netCorrect" numeric not null,
  total integer not null,
  breakdown jsonb not null,
  warnings jsonb null
);

create index if not exists attempts_user_id_idx on public.attempts ("userId");
create index if not exists attempts_exam_id_idx on public.attempts ("examId");

alter table public.attempts enable row level security;

drop policy if exists "attempts_select_own_or_admin" on public.attempts;
create policy "attempts_select_own_or_admin" on public.attempts
  for select
  using (auth.uid() = "userId" or public.is_admin());

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert
  with check (auth.uid() = "userId");

drop policy if exists "attempts_update_admin" on public.attempts;
create policy "attempts_update_admin" on public.attempts
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "attempts_delete_admin" on public.attempts;
create policy "attempts_delete_admin" on public.attempts
  for delete
  using (public.is_admin());
