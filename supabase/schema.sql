-- Little Haven database schema. Run in Supabase SQL Editor.
-- Create users via Supabase Auth first, then assign their role in public.profiles.
create extension if not exists pgcrypto;

create type public.staff_role as enum ('Doctor','Receptionist','Clinic Manager');
create type public.appointment_status as enum ('waiting','in_progress','completed','cancelled');
create type public.payment_status as enum ('unpaid','partial','paid','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique not null,
  role public.staff_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id),
  name text not null,
  species text not null,
  breed text,
  sex text,
  date_of_birth date,
  microchip_no text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id),
  patient_id uuid not null references public.patients(id),
  doctor_id uuid references public.profiles(id),
  starts_at timestamptz not null,
  reason text,
  status public.appointment_status not null default 'waiting',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  appointment_id uuid references public.appointments(id),
  doctor_id uuid not null references public.profiles(id),
  chief_complaint text,
  anamnesis text,
  vitals text,
  diagnosis text,
  treatment text,
  medication text,
  clinical_notes text,
  follow_up text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  active boolean not null default true
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  owner_id uuid not null references public.owners(id),
  appointment_id uuid references public.appointments(id),
  invoice_no text unique not null,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status public.payment_status not null default 'unpaid',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_id uuid references public.services(id),
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  reference_no text,
  received_by uuid references public.profiles(id),
  paid_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.owners enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.medical_records enable row level security;
alter table public.services enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_role()
returns public.staff_role language sql stable security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid() and active = true $$;

-- Authenticated active staff can read operational data.
create policy "active staff read profiles" on public.profiles for select to authenticated
using (id = auth.uid() or public.current_role() = 'Clinic Manager');

create policy "staff read owners" on public.owners for select to authenticated
using (public.current_role() is not null);
create policy "reception and manager manage owners" on public.owners for all to authenticated
using (public.current_role() in ('Receptionist','Clinic Manager'))
with check (public.current_role() in ('Receptionist','Clinic Manager'));

create policy "staff read patients" on public.patients for select to authenticated
using (public.current_role() is not null);
create policy "reception and manager manage patients" on public.patients for all to authenticated
using (public.current_role() in ('Receptionist','Clinic Manager'))
with check (public.current_role() in ('Receptionist','Clinic Manager'));

create policy "staff read appointments" on public.appointments for select to authenticated
using (public.current_role() is not null);
create policy "reception and manager manage appointments" on public.appointments for all to authenticated
using (public.current_role() in ('Receptionist','Clinic Manager'))
with check (public.current_role() in ('Receptionist','Clinic Manager'));
create policy "doctor update assigned appointment status" on public.appointments for update to authenticated
using (public.current_role() = 'Doctor' and doctor_id = auth.uid())
with check (public.current_role() = 'Doctor' and doctor_id = auth.uid());

create policy "staff read medical records" on public.medical_records for select to authenticated
using (public.current_role() is not null);
create policy "doctors create medical records" on public.medical_records for insert to authenticated
with check (public.current_role() = 'Doctor' and doctor_id = auth.uid());
create policy "doctors update own records" on public.medical_records for update to authenticated
using (public.current_role() = 'Doctor' and doctor_id = auth.uid())
with check (public.current_role() = 'Doctor' and doctor_id = auth.uid());

create policy "staff read services" on public.services for select to authenticated
using (public.current_role() is not null);
create policy "manager manage services" on public.services for all to authenticated
using (public.current_role() = 'Clinic Manager')
with check (public.current_role() = 'Clinic Manager');

create policy "staff read invoices" on public.invoices for select to authenticated
using (public.current_role() is not null);
create policy "reception create invoices" on public.invoices for insert to authenticated
with check (public.current_role() in ('Receptionist','Clinic Manager'));
create policy "reception update invoices" on public.invoices for update to authenticated
using (public.current_role() in ('Receptionist','Clinic Manager'))
with check (public.current_role() in ('Receptionist','Clinic Manager'));

create policy "staff read invoice items" on public.invoice_items for select to authenticated
using (public.current_role() is not null);
create policy "reception manage invoice items" on public.invoice_items for all to authenticated
using (public.current_role() in ('Receptionist','Clinic Manager'))
with check (public.current_role() in ('Receptionist','Clinic Manager'));

create policy "staff read payments" on public.payments for select to authenticated
using (public.current_role() is not null);
create policy "reception record payments" on public.payments for insert to authenticated
with check (public.current_role() in ('Receptionist','Clinic Manager'));

create policy "manager read audit logs" on public.audit_logs for select to authenticated
using (public.current_role() = 'Clinic Manager');
create policy "authenticated create audit logs" on public.audit_logs for insert to authenticated
with check (actor_id = auth.uid());

-- IMPORTANT: provision accounts from Supabase Auth, then insert matching profiles rows.
-- Never expose the Supabase service_role key in browser code.
