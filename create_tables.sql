-- Create update_updated_at_column function if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create traffic_events table (User provided schema)
create table if not exists public.traffic_events (
  id bigserial not null,
  event_id text not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  location_name text null,
  province text null,
  district text null,
  subdistrict text null,
  event_type text not null,
  event_category text null,
  severity text not null,
  severity_score integer null,
  title_th text null,
  title_en text null,
  description_th text null,
  description_en text null,
  event_date timestamp with time zone not null,
  start_time timestamp with time zone null,
  end_time timestamp with time zone null,
  duration_minutes integer null,
  year integer not null,
  month integer null,
  day_of_week integer null,
  hour integer null,
  affected_roads text[] null,
  estimated_delay_minutes integer null,
  traffic_flow_impact text null,
  source text not null,
  source_url text null,
  data_year integer null,
  verified boolean null default false,
  image_url text null,
  video_url text null,
  weather_condition text null,
  temperature numeric(5, 2) null,
  rainfall numeric(5, 2) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint traffic_events_pkey primary key (id),
  constraint traffic_events_event_id_key unique (event_id),
  constraint traffic_events_severity_check check (
    (
      severity = any (array['low'::text, 'medium'::text, 'high'::text])
    )
  )
) TABLESPACE pg_default;

-- Indices for traffic_events
create index IF not exists idx_traffic_events_event_date on public.traffic_events using btree (event_date desc) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_year on public.traffic_events using btree (year desc) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_type on public.traffic_events using btree (event_type) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_severity on public.traffic_events using btree (severity) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_source on public.traffic_events using btree (source) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_province on public.traffic_events using btree (province) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_year_type on public.traffic_events using btree (year, event_type) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_province_year on public.traffic_events using btree (province, year) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_date_severity on public.traffic_events using btree (event_date, severity) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_month on public.traffic_events using btree (year, month) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_hour on public.traffic_events using btree (hour) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_day_of_week on public.traffic_events using btree (day_of_week) TABLESPACE pg_default;
create index IF not exists idx_traffic_events_location on public.traffic_events using btree (latitude, longitude) TABLESPACE pg_default;

-- Trigger for traffic_events
drop trigger if exists update_traffic_events_updated_at on traffic_events;
create trigger update_traffic_events_updated_at BEFORE
update on traffic_events for EACH row
execute FUNCTION update_updated_at_column ();


-- Create user_reports table (My previous design)
create table if not exists user_reports (
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

-- Enable RLS for user_reports
alter table user_reports enable row level security;

-- Policies for user_reports
drop policy if exists "Reports are viewable by everyone" on user_reports;
create policy "Reports are viewable by everyone" on user_reports
  for select using (true);

drop policy if exists "Anyone can insert reports" on user_reports;
create policy "Anyone can insert reports" on user_reports
  for insert with check (true);

drop policy if exists "Only admins can update status" on user_reports;
create policy "Only admins can update status" on user_reports
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
