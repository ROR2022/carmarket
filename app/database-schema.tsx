// This is for reference only - execute this SQL in your Supabase SQL Editor

/*
-- Create cars table
create table cars (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  description text,
  price integer not null,
  year integer not null,
  make text not null,
  model text not null,
  km integer not null,
  location text not null,
  category text not null,
  condition text not null,
  seller_id uuid references auth.users(id),
  is_sold boolean default false
);

-- Create car_images table
create table car_images (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  car_id uuid references cars(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false
);

-- Create user_profiles table
create table user_profiles (
  id uuid references auth.users(id) primary key,
  created_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  phone text,
  address text
);

-- Create favorites table
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade,
  car_id uuid references cars(id) on delete cascade,
  unique(user_id, car_id)
);

-- Set up Row Level Security (RLS)
alter table cars enable row level security;
alter table car_images enable row level security;
alter table user_profiles enable row level security;
alter table favorites enable row level security;

-- Create policies
create policy "Public cars are viewable by everyone"
  on cars for select
  using (not is_sold);

create policy "Users can insert their own cars"
  on cars for insert
  with check (seller_id = auth.uid());

create policy "Users can update their own cars"
  on cars for update
  using (seller_id = auth.uid());

-- Similar policies for other tables...
*/

