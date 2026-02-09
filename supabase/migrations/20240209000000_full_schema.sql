-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Custom Types
create type user_role as enum ('admin', 'instructor', 'learner');
create type course_status as enum ('draft', 'published', 'archived');
create type enrollment_status as enum ('active', 'completed', 'cancelled');

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role user_role default 'learner',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger for new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'learner');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger creates profile on auth.users insert
-- Note: In local dev this might need to be created manually or handled by Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- CATEGORIES
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;

create policy "Categories are viewable by everyone" on categories
  for select using (true);

create policy "Admins can insert categories" on categories
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- COURSES
create table courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text,
  price integer default 0, -- in cents
  instructor_id uuid references profiles(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  status course_status default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table courses enable row level security;

create policy "Published courses are viewable by everyone" on courses
  for select using (status = 'published');

create policy "Instructors can insert courses" on courses
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );

create policy "Instructors can update own courses" on courses
  for update using (
    instructor_id = auth.uid() or 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- LESSONS
create table lessons (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  description text,
  content text, 
  video_url text,
  meet_link text,
  is_preview boolean default false,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table lessons enable row level security;

create policy "Lessons viewable by enrolled users" on lessons
  for select using (
    is_preview = true or 
    exists (
      select 1 from enrollments 
      where user_id = auth.uid() and course_id = lessons.course_id and status = 'active'
    ) or
    exists (select 1 from courses where id = lessons.course_id and instructor_id = auth.uid()) or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Instructors can insert lessons" on lessons
  for insert with check (
    exists (select 1 from courses where id = course_id and (instructor_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin')))
  );

create policy "Instructors can update lessons" on lessons
  for update using (
    exists (select 1 from courses where id = course_id and (instructor_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin')))
  );


-- ENROLLMENTS
create table enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  status enrollment_status default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

alter table enrollments enable row level security;

create policy "Users can view own enrollments" on enrollments
  for select using (user_id = auth.uid());

create policy "Admins/Instructors can view course enrollments" on enrollments
  for select using (
    exists (select 1 from courses where id = course_id and instructor_id = auth.uid()) or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- LESSON PROGRESS
create table lesson_progress (
  user_id uuid references profiles(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, lesson_id)
);

alter table lesson_progress enable row level security;

create policy "Users can view own progress" on lesson_progress
  for select using (user_id = auth.uid());

create policy "Users can update own progress" on lesson_progress
  for insert with check (user_id = auth.uid());

create policy "Users can update own progress update" on lesson_progress
  for update using (user_id = auth.uid());


-- QUIZZES (Simplified for MVP)
create table quizzes (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  title text not null,
  passing_score integer default 70,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table quizzes enable row level security;

create policy "Quizzes viewable by enrolled" on quizzes
  for select using (
    exists (
      select 1 from lessons
      join enrollments on enrollments.course_id = lessons.course_id
      where lessons.id = quizzes.lesson_id
      and enrollments.user_id = auth.uid()
    ) or
    exists (
      select 1 from lessons
      join courses on courses.id = lessons.course_id
      where lessons.id = quizzes.lesson_id
      and (courses.instructor_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
    )
  );

create table quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null,
  correct_option_index integer not null,
  "order" integer default 0
);

alter table quiz_questions enable row level security;

create policy "Questions viewable by enrolled" on quiz_questions
  for select using (
    exists (
      select 1 from quizzes
      where id = quiz_questions.quiz_id
      -- relying on quiz policy implicitly or duplicating logic? RLS doesn't cascade, need explicit check
      and exists (
        select 1 from lessons
        join enrollments on enrollments.course_id = lessons.course_id
        where lessons.id = quizzes.lesson_id
        and enrollments.user_id = auth.uid()
      )
    ) or
    exists (
      select 1 from profiles where id = auth.uid() and (role = 'admin' or role = 'instructor') 
      -- Simplification: Instructors can see all questions for now to avoid complex join
    )
  );


-- PAYMENTS
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete set null,
  stripe_session_id text not null unique,
  amount integer not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table payments enable row level security;

create policy "Users can view own payments" on payments
  for select using (user_id = auth.uid());

