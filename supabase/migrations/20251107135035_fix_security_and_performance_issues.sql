/*
  # Fix Security and Performance Issues
  
  1. Missing Foreign Key Indexes
    - Add index on platnosci.zajecia_id
    - Add index on uczen_ksiazka.ksiazka_id
    - Add index on uczen_ksiazka.student_id
  
  2. RLS Policy Optimization
    - Replace auth.uid() with (select auth.uid()) in all policies
    - This prevents re-evaluation for each row, improving query performance
  
  3. Multiple Permissive Policies
    - Drop redundant SELECT policies where FOR ALL policies exist
    - Consolidate policies to avoid duplicate checks
  
  4. Policy Structure
    - Keep separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
    - Use optimized auth function calls
*/

-- Add missing foreign key indexes
create index if not exists idx_platnosci_zajecia_id on public.platnosci (zajecia_id);
create index if not exists idx_uczen_ksiazka_ksiazka_id on public.uczen_ksiazka (ksiazka_id);
create index if not exists idx_uczen_ksiazka_student_id on public.uczen_ksiazka (student_id);

-- Drop all existing policies to recreate them optimized
drop policy if exists "owner_select_uczniowie" on public.uczniowie;
drop policy if exists "owner_ins_uczniowie" on public.uczniowie;
drop policy if exists "owner_upd_uczniowie" on public.uczniowie;
drop policy if exists "owner_del_uczniowie" on public.uczniowie;

drop policy if exists "owner_select_przedmiot_ucznia" on public.przedmiot_ucznia;
drop policy if exists "owner_cud_przedmiot_ucznia" on public.przedmiot_ucznia;

drop policy if exists "owner_select_zajecia" on public.zajecia;
drop policy if exists "owner_cud_zajecia" on public.zajecia;

drop policy if exists "owner_select_platnosci" on public.platnosci;
drop policy if exists "owner_cud_platnosci" on public.platnosci;

drop policy if exists "owner_select_linki" on public.linki;
drop policy if exists "owner_cud_linki" on public.linki;

drop policy if exists "owner_select_ksiazki" on public.ksiazki;
drop policy if exists "owner_cud_ksiazki" on public.ksiazki;

drop policy if exists "owner_select_uczen_ksiazka" on public.uczen_ksiazka;
drop policy if exists "owner_cud_uczen_ksiazka" on public.uczen_ksiazka;

drop policy if exists "owner_select_diagnozy" on public.diagnozy;
drop policy if exists "owner_cud_diagnozy" on public.diagnozy;

-- Create optimized policies for uczniowie
create policy "owner_select_uczniowie" on public.uczniowie
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_uczniowie" on public.uczniowie
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_uczniowie" on public.uczniowie
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_uczniowie" on public.uczniowie
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for przedmiot_ucznia
create policy "owner_select_przedmiot_ucznia" on public.przedmiot_ucznia
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_przedmiot_ucznia" on public.przedmiot_ucznia
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_przedmiot_ucznia" on public.przedmiot_ucznia
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_przedmiot_ucznia" on public.przedmiot_ucznia
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for zajecia
create policy "owner_select_zajecia" on public.zajecia
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_zajecia" on public.zajecia
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_zajecia" on public.zajecia
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_zajecia" on public.zajecia
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for platnosci
create policy "owner_select_platnosci" on public.platnosci
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_platnosci" on public.platnosci
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_platnosci" on public.platnosci
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_platnosci" on public.platnosci
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for linki
create policy "owner_select_linki" on public.linki
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_linki" on public.linki
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_linki" on public.linki
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_linki" on public.linki
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for ksiazki
create policy "owner_select_ksiazki" on public.ksiazki
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_ksiazki" on public.ksiazki
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_ksiazki" on public.ksiazki
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_ksiazki" on public.ksiazki
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for uczen_ksiazka
create policy "owner_select_uczen_ksiazka" on public.uczen_ksiazka
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_uczen_ksiazka" on public.uczen_ksiazka
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_uczen_ksiazka" on public.uczen_ksiazka
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_uczen_ksiazka" on public.uczen_ksiazka
  for delete to authenticated 
  using (created_by = (select auth.uid()));

-- Create optimized policies for diagnozy
create policy "owner_select_diagnozy" on public.diagnozy
  for select to authenticated 
  using (created_by = (select auth.uid()));

create policy "owner_insert_diagnozy" on public.diagnozy
  for insert to authenticated 
  with check (created_by = (select auth.uid()));

create policy "owner_update_diagnozy" on public.diagnozy
  for update to authenticated 
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "owner_delete_diagnozy" on public.diagnozy
  for delete to authenticated 
  using (created_by = (select auth.uid()));
