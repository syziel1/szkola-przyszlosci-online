/*
  # Optimize Database Indexes
  
  1. Remove Unused Indexes
    - Drop indexes that are redundant or not used by application queries
    - Keep indexes that support RLS policies and actual queries
  
  2. Index Strategy
    - Keep indexes used by RLS policies (created_by columns)
    - Keep indexes used by foreign key relationships
    - Keep indexes used by ORDER BY clauses in application
    - Drop indexes for features not yet implemented
*/

-- Remove indexes for tables/features not actively used in the application yet
drop index if exists public.idx_przedmiot_ucznia_created_by;
drop index if exists public.idx_przedmiot_ucznia_subject;
drop index if exists public.idx_linki_owner;
drop index if exists public.idx_linki_kind;
drop index if exists public.idx_ksiazki_created_by_tytul;
drop index if exists public.idx_diagnozy_created_by_data;
drop index if exists public.idx_diagnozy_student_subject;
drop index if exists public.idx_uczen_ksiazka_ksiazka_id;
drop index if exists public.idx_uczen_ksiazka_student_id;

-- Remove redundant indexes where primary key or unique constraints already provide coverage
drop index if exists public.idx_uczniowie_nazwisko_imie;

-- Keep essential indexes that are used by the application:
-- idx_uczniowie_created_by - used by RLS policies
-- idx_zajecia_created_by_start - used by dashboard queries with ORDER BY
-- idx_zajecia_student_start - used by student detail page
-- idx_platnosci_created_by_data - used by payment queries
-- idx_platnosci_student_data - used by student payment history
-- idx_platnosci_zajecia_id - foreign key index for joins

-- Note: Remaining unused index warnings are expected for a new database
-- These indexes will be utilized once data is added and queries are executed
