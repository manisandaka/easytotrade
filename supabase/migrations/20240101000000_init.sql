-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'learner' check (role in ('admin', 'instructor', 'learner')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'learner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- CATEGORIES
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
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

create policy "Admins can update categories" on categories
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );


-- COURSES
create table courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  description text,
  price integer default 0, -- in cents
  instructor_id uuid references profiles(id) not null,
  category_id uuid references categories(id),
  published boolean default false,
  image_url text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table courses enable row level security;

create policy "Published courses are viewable by everyone" on courses
  for select using (published = true);

create policy "Admins and Instrutors can view all courses" on courses
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );

create policy "Admins and Instructors can insert courses" on courses
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'instructor'))
  );

create policy "Instructors can update own courses" on courses
  for update using (
    auth.uid() = instructor_id
  );


-- ENROLLMENTS
create table enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  course_id uuid references courses(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

alter table enrollments enable row level security;

create policy "Users can view own enrollments" on enrollments
  for select using (auth.uid() = user_id);

create policy "Admins can view all enrollments" on enrollments
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
  
-- Service role policy for webhook usage (implicit via service role key, but explicit helps understanding)
-- Note: Service role bypasses RLS, so this is just documentation.


-- LESSONS
create table lessons (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  slug text not null,
  content text, -- Markdown content
  video_url text, -- External link or embedded URL
  "order" integer not null default 0,
  is_free boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(course_id, slug)
);

alter table lessons enable row level security;

-- Policy: Viewable if enrolled OR if user is admin/instructor of course OR if lesson is free preview
create policy "Lessons are viewable by enrolled users or owners" on lessons
  for select using (
    exists (
      select 1 from enrollments
      where user_id = auth.uid() and course_id = lessons.course_id
    )
    or
    exists (
      select 1 from courses
      where id = lessons.course_id and instructor_id = auth.uid()
    )
    or
    exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
    )
    or
    is_free = true
  );

create policy "Instructors can insert lessons for own courses" on lessons
  for insert with check (
    exists (
      select 1 from courses
      where id = course_id and instructor_id = auth.uid()
    )
  );

create policy "Instructors can update lessons for own courses" on lessons
  for update using (
      exists (
      select 1 from courses
      where id = course_id and instructor_id = auth.uid()
    )
  );


-- LESSON PROGRESS
create table lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  lesson_id uuid references lessons(id) not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  last_watched_position integer default 0, -- in seconds
  unique(user_id, lesson_id)
);

alter table lesson_progress enable row level security;

create policy "Users can view and update own progress" on lesson_progress
  for all using (auth.uid() = user_id);


-- QUIZZES
create table quizzes (
  id uuid default uuid_generate_v4() primary key,
  lesson_id uuid references lessons(id) on delete cascade not null,
  title text not null,
  passing_score integer default 70,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table quizzes enable row level security;

create policy "Quizzes viewable by those who can view lesson" on quizzes
  for select using (
      exists (
      select 1 from lessons
      where id = quizzes.lesson_id
      -- Recursively check lesson viewability logic (simplified here: enrolled)
      and (
          exists (select 1 from enrollments where user_id = auth.uid() and course_id = lessons.course_id)
          or 
          exists (select 1 from courses where id = lessons.course_id and instructor_id = auth.uid())
          or
          exists (select 1 from profiles where id = auth.uid() and role = 'admin')
      )
    )
  );


-- QUIZ QUESTIONS
create table quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- Array of strings
  correct_option_index integer not null,
  "order" integer default 0
);

alter table quiz_questions enable row level security;

create policy "Quiz questions viewable via quiz access logic" on quiz_questions
  for select using (
    exists (
        select 1 from quizzes
        where id = quiz_questions.quiz_id
        -- Simplified redundancy check
    )
  );


-- QUIZ ATTEMPTS
create table quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  quiz_id uuid references quizzes(id) not null,
  score integer not null,
  passed boolean not null,
  answers jsonb, -- record user answers
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table quiz_attempts enable row level security;

create policy "Users can view own quiz attempts" on quiz_attempts
  for select using (auth.uid() = user_id);

create policy "Users can insert own quiz attempts" on quiz_attempts
  for insert with check (auth.uid() = user_id);

