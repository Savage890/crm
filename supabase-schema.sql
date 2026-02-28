-- ============================================
-- NexusCRM Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CONTACTS TABLE
-- ============================================
create table if not exists contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  email text,
  phone text,
  company text,
  status text default 'active' check (status in ('active', 'inactive', 'lead', 'customer')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for contacts
alter table contacts enable row level security;

create policy "Users can view own contacts"
  on contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert own contacts"
  on contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contacts"
  on contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on contacts for delete
  using (auth.uid() = user_id);

-- ============================================
-- DEALS TABLE
-- ============================================
create table if not exists deals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  value numeric default 0,
  stage text default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  contact_name text,
  expected_close date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for deals
alter table deals enable row level security;

create policy "Users can view own deals"
  on deals for select
  using (auth.uid() = user_id);

create policy "Users can insert own deals"
  on deals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own deals"
  on deals for update
  using (auth.uid() = user_id);

create policy "Users can delete own deals"
  on deals for delete
  using (auth.uid() = user_id);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
create table if not exists activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  type text default 'task' check (type in ('task', 'call', 'email', 'meeting', 'note')),
  description text,
  due_date date,
  completed boolean default false,
  contact_name text,
  deal_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for activities
alter table activities enable row level security;

create policy "Users can view own activities"
  on activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on activities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activities"
  on activities for update
  using (auth.uid() = user_id);

create policy "Users can delete own activities"
  on activities for delete
  using (auth.uid() = user_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at_column();

create trigger update_deals_updated_at
  before update on deals
  for each row execute function update_updated_at_column();

create trigger update_activities_updated_at
  before update on activities
  for each row execute function update_updated_at_column();
