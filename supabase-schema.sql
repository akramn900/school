-- SchoolMS Supabase schema
-- Run this once in Supabase Dashboard > SQL Editor.
-- This demo policy allows the static GitHub Pages app to read/write with the anon key.
-- For production, replace these broad policies with Supabase Auth + role-based RLS.

create extension if not exists pgcrypto;

create table if not exists public.admins (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  password text not null,
  "createdAt" timestamptz default now()
);

create table if not exists public.teachers (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  password text,
  name text,
  surname text,
  email text,
  phone text,
  address text,
  "bloodType" text,
  sex text,
  img text,
  birthday date,
  "createdAt" timestamptz default now()
);

create table if not exists public.parents (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  password text,
  name text,
  surname text,
  email text,
  phone text,
  address text,
  "createdAt" timestamptz default now()
);

create table if not exists public.students (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  password text,
  name text,
  surname text,
  email text,
  phone text,
  address text,
  "bloodType" text,
  sex text,
  img text,
  birthday date,
  "gradeId" text,
  "classId" text,
  "parentId" text,
  "createdAt" timestamptz default now()
);

create table if not exists public.grades (
  id text primary key,
  level integer not null
);

create table if not exists public.classes (
  id text primary key default gen_random_uuid()::text,
  name text,
  capacity integer,
  "gradeId" text,
  "supervisorId" text
);

create table if not exists public.subjects (
  id text primary key default gen_random_uuid()::text,
  name text
);

create table if not exists public.lessons (
  id text primary key default gen_random_uuid()::text,
  name text,
  day text,
  "startTime" text,
  "endTime" text,
  "subjectId" text,
  "classId" text,
  "teacherId" text
);

create table if not exists public.exams (
  id text primary key default gen_random_uuid()::text,
  title text,
  "startTime" timestamptz,
  "endTime" timestamptz,
  "lessonId" text
);

create table if not exists public.assignments (
  id text primary key default gen_random_uuid()::text,
  title text,
  "startDate" date,
  "dueDate" date,
  "lessonId" text
);

create table if not exists public.results (
  id text primary key default gen_random_uuid()::text,
  score numeric,
  "examId" text,
  "assignmentId" text,
  "studentId" text
);

create table if not exists public.attendance (
  id text primary key default gen_random_uuid()::text,
  date date,
  present boolean,
  "studentId" text,
  "lessonId" text
);

create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text,
  description text,
  "startTime" timestamptz,
  "endTime" timestamptz,
  "classId" text
);

create table if not exists public.announcements (
  id text primary key default gen_random_uuid()::text,
  title text,
  description text,
  date date,
  "classId" text
);

create or replace function public.dashboard_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'students',      (select count(*)::int from students),
    'teachers',      (select count(*)::int from teachers),
    'parents',       (select count(*)::int from parents),
    'subjects',      (select count(*)::int from subjects),
    'classes',       (select count(*)::int from classes),
    'lessons',       (select count(*)::int from lessons),
    'exams',         (select count(*)::int from exams),
    'announcements', (select count(*)::int from announcements),
    'events',        (select count(*)::int from events)
  );
$$;

create or replace function public.login_user(
  p_username text,
  p_password text,
  p_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_role is null or p_role = 'admin' then
    select jsonb_build_object('token', encode(gen_random_bytes(16), 'hex'), 'role', 'admin', 'username', username, 'id', id)
      into result
      from admins
      where username = p_username and password = p_password
      limit 1;
    if result is not null then return result; end if;
  end if;

  if p_role is null or p_role = 'teacher' then
    select jsonb_build_object('token', encode(gen_random_bytes(16), 'hex'), 'role', 'teacher', 'username', username, 'id', id)
      into result
      from teachers
      where username = p_username and password = p_password
      limit 1;
    if result is not null then return result; end if;
  end if;

  if p_role is null or p_role = 'student' then
    select jsonb_build_object('token', encode(gen_random_bytes(16), 'hex'), 'role', 'student', 'username', username, 'id', id)
      into result
      from students
      where username = p_username and password = p_password
      limit 1;
    if result is not null then return result; end if;
  end if;

  if p_role is null or p_role = 'parent' then
    select jsonb_build_object('token', encode(gen_random_bytes(16), 'hex'), 'role', 'parent', 'username', username, 'id', id)
      into result
      from parents
      where username = p_username and password = p_password
      limit 1;
    if result is not null then return result; end if;
  end if;

  return jsonb_build_object('error', 'Invalid credentials');
end;
$$;

grant usage on schema public to anon;
grant select, insert, update, delete on all tables in schema public to anon;
grant execute on function public.dashboard_stats() to anon;
grant execute on function public.login_user(text, text, text) to anon;

do $$
declare
  t text;
begin
  foreach t in array array[
    'admins','teachers','parents','students','grades','classes','subjects',
    'lessons','exams','assignments','results','attendance','events','announcements'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists anon_select on public.%I', t);
    execute format('create policy anon_select on public.%I for select to anon using (true)', t);

    execute format('drop policy if exists anon_insert on public.%I', t);
    execute format('create policy anon_insert on public.%I for insert to anon with check (true)', t);

    execute format('drop policy if exists anon_update on public.%I', t);
    execute format('create policy anon_update on public.%I for update to anon using (true) with check (true)', t);

    execute format('drop policy if exists anon_delete on public.%I', t);
    execute format('create policy anon_delete on public.%I for delete to anon using (true)', t);
  end loop;
end $$;
