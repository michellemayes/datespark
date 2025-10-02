-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create trigger to auto-create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create saved_date_ideas table
create table public.saved_date_ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  budget text,
  duration text,
  location text,
  dress_code text,
  activities jsonb,
  food_spots jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.saved_date_ideas enable row level security;

create policy "Users can view own saved ideas"
  on public.saved_date_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved ideas"
  on public.saved_date_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved ideas"
  on public.saved_date_ideas for delete
  using (auth.uid() = user_id);

-- Create user_preferences table
create table public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  budget text,
  duration text,
  dress_code text,
  location text,
  dietary_restrictions jsonb,
  user_location text,
  search_radius integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_preferences enable row level security;

create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);