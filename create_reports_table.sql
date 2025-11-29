-- Create user_reports table
create table user_reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  lat double precision not null,
  lon double precision not null,
  category text not null,
  severity integer default 5,
  pub_date timestamp with time zone default timezone('utc'::text, now()) not null,
  source text default 'User Report',
  reporter text default 'Anonymous',
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  upvotes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table user_reports enable row level security;

-- Policies
create policy "Reports are viewable by everyone" on user_reports
  for select using (true);

create policy "Anyone can insert reports" on user_reports
  for insert with check (true);

create policy "Only admins can update status" on user_reports
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
