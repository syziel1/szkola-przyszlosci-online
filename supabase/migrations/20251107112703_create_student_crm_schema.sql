/*
  # Student CRM Database Schema
  
  1. Enums
    - subject_enum: matematyka, fizyka, informatyka
    - homework_status_enum: brak, zadane, oddane, poprawa
    - payment_status_enum: oczekuje, zapłacone, zaległe, anulowane
    - link_owner_enum: uczen, przedmiot_ucznia, zajecia, global, ksiazka, diagnoza
    - link_kind_enum: odrabiamy, tablica, zoom, messenger, whatsapp, drive, inny
  
  2. Tables
    - uczniowie: Student profiles with contact info
    - przedmiot_ucznia: Student-subject relationships
    - zajecia: Lessons/sessions with topics and homework
    - platnosci: Payment records
    - linki: Universal links table for various resources
    - ksiazki: Books/textbooks
    - uczen_ksiazka: Student-book relationships
    - diagnozy: Diagnostic tests and assessments
  
  3. Security
    - RLS enabled on all tables
    - Policies restrict access to created_by = auth.uid()
    - Cascade deletes configured for data integrity
*/

create type subject_enum as enum ('matematyka', 'fizyka', 'informatyka');

create type homework_status_enum as enum ('brak', 'zadane', 'oddane', 'poprawa');
create type payment_status_enum  as enum ('oczekuje', 'zapłacone', 'zaległe', 'anulowane');

create table if not exists public.uczniowie (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  imie text not null,
  nazwisko text not null,
  email text,
  telefon text,
  whatsapp text,
  messenger text,
  szkola text,
  klasa text,
  notatki text
);

create index if not exists idx_uczniowie_created_by on public.uczniowie (created_by);
create index if not exists idx_uczniowie_nazwisko_imie on public.uczniowie (nazwisko, imie);

create table if not exists public.przedmiot_ucznia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  student_id uuid not null references public.uczniowie(id) on delete cascade,
  subject subject_enum not null,
  notatki text
);

create unique index if not exists przedmiot_ucznia_unique on public.przedmiot_ucznia (student_id, subject);
create index if not exists idx_przedmiot_ucznia_created_by on public.przedmiot_ucznia (created_by);
create index if not exists idx_przedmiot_ucznia_subject on public.przedmiot_ucznia (subject);

create table if not exists public.zajecia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  student_id uuid not null references public.uczniowie(id) on delete cascade,
  subject subject_enum not null,
  start_at timestamptz not null,
  end_at   timestamptz,
  temat text,
  zrozumienie smallint check (zrozumienie between 1 and 5),
  trudnosci text,
  praca_domowa text,
  status_pd homework_status_enum not null default 'brak'
);

create index if not exists idx_zajecia_created_by_start on public.zajecia (created_by, start_at desc);
create index if not exists idx_zajecia_student_start on public.zajecia (student_id, start_at desc);

create table if not exists public.platnosci (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  student_id uuid not null references public.uczniowie(id) on delete cascade,
  zajecia_id uuid references public.zajecia(id) on delete set null,
  data_platnosci date not null default current_date,
  kwota numeric(10,2) not null,
  waluta text not null default 'PLN',
  metoda text,
  status payment_status_enum not null default 'oczekuje',
  notatki text,
  invoice_url text
);

create index if not exists idx_platnosci_created_by_data on public.platnosci (created_by, data_platnosci desc);
create index if not exists idx_platnosci_student_data on public.platnosci (student_id, data_platnosci desc);

create type link_owner_enum as enum ('uczen', 'przedmiot_ucznia', 'zajecia', 'global', 'ksiazka', 'diagnoza');
create type link_kind_enum  as enum ('odrabiamy', 'tablica', 'zoom', 'messenger', 'whatsapp', 'drive', 'inny');

create table if not exists public.linki (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  owner_type link_owner_enum not null,
  owner_id uuid,
  kind link_kind_enum not null,
  url text not null,
  label text,
  metadata jsonb
);

create index if not exists idx_linki_owner on public.linki (created_by, owner_type, owner_id);
create index if not exists idx_linki_kind on public.linki (kind);

create table if not exists public.ksiazki (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  wydawnictwo text,
  tytul text not null,
  url text
);

create index if not exists idx_ksiazki_created_by_tytul on public.ksiazki (created_by, tytul);

create table if not exists public.uczen_ksiazka (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  student_id uuid not null references public.uczniowie(id) on delete cascade,
  ksiazka_id uuid not null references public.ksiazki(id) on delete cascade,
  subject subject_enum,
  unikalne boolean default false
);

create table if not exists public.diagnozy (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  student_id uuid not null references public.uczniowie(id) on delete cascade,
  subject subject_enum not null,
  data_testu date not null default current_date,
  narzedzie text,
  wynik numeric(10,2),
  rubric jsonb,
  wnioski text,
  cele text
);

create index if not exists idx_diagnozy_created_by_data on public.diagnozy (created_by, data_testu desc);
create index if not exists idx_diagnozy_student_subject on public.diagnozy (student_id, subject, data_testu desc);

alter table public.uczniowie enable row level security;
alter table public.przedmiot_ucznia enable row level security;
alter table public.zajecia enable row level security;
alter table public.platnosci enable row level security;
alter table public.linki enable row level security;
alter table public.ksiazki enable row level security;
alter table public.uczen_ksiazka enable row level security;
alter table public.diagnozy enable row level security;

create policy "owner_select_uczniowie" on public.uczniowie
  for select to authenticated using (created_by = auth.uid());
create policy "owner_ins_uczniowie" on public.uczniowie
  for insert to authenticated with check (created_by = auth.uid());
create policy "owner_upd_uczniowie" on public.uczniowie
  for update to authenticated using (created_by = auth.uid());
create policy "owner_del_uczniowie" on public.uczniowie
  for delete to authenticated using (created_by = auth.uid());

create policy "owner_select_przedmiot_ucznia" on public.przedmiot_ucznia
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_przedmiot_ucznia" on public.przedmiot_ucznia
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "owner_select_zajecia" on public.zajecia
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_zajecia" on public.zajecia
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "owner_select_platnosci" on public.platnosci
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_platnosci" on public.platnosci
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "owner_select_linki" on public.linki
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_linki" on public.linki
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "owner_select_ksiazki" on public.ksiazki
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_ksiazki" on public.ksiazki
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "owner_select_uczen_ksiazka" on public.uczen_ksiazka
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_uczen_ksiazka" on public.uczen_ksiazka
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "owner_select_diagnozy" on public.diagnozy
  for select to authenticated using (created_by = auth.uid());
create policy "owner_cud_diagnozy" on public.diagnozy
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
