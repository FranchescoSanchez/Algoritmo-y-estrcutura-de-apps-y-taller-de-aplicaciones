-- =====================================================================
--  Mi Portafolio · configuracion de Supabase
--
--  Pega TODO este archivo en: Supabase -> SQL Editor -> New query -> Run
--
--  ANTES de ejecutarlo, cambia PEGA_AQUI_TU_UID (mas abajo) por el UID
--  de tu usuario (Authentication -> Users -> columna "User UID").
--  Si te olvidas, el editor mostrara un error de tipo uuid y no se crea
--  nada (asi nunca queda abierto por accidente).
--
--  Resultado: cualquiera puede VER las tareas, pero solo TU cuenta puede
--  subir, editar o borrar.
-- =====================================================================

-- 1) Quien es el dueno del portafolio --------------------------------
create or replace function public.es_dueno()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() = 'f2d20dc1-ee26-47ac-8975-f0921e878b8c'::uuid
$$;

-- 2) Tabla de tareas ---------------------------------------------------
create table if not exists public.tareas (
  id              uuid primary key default gen_random_uuid(),
  curso           text        not null,
  unidad          integer     not null check (unidad between 1 and 4),
  semana          integer     not null check (semana between 1 and 4),
  titulo          text,
  nombre_original text        not null,
  tipo_mime       text,
  tamano          bigint,
  ruta            text        not null,          -- ruta del archivo dentro del bucket
  fecha_subida    timestamptz not null default now()
);

create index if not exists idx_tareas_ubicacion on public.tareas (curso, unidad, semana);

alter table public.tareas enable row level security;

drop policy if exists "todos ven las tareas"     on public.tareas;
drop policy if exists "solo el dueno inserta"    on public.tareas;
drop policy if exists "solo el dueno modifica"   on public.tareas;
drop policy if exists "solo el dueno borra"      on public.tareas;

create policy "todos ven las tareas"   on public.tareas for select to anon, authenticated using (true);
create policy "solo el dueno inserta"  on public.tareas for insert to authenticated with check (public.es_dueno());
create policy "solo el dueno modifica" on public.tareas for update to authenticated using (public.es_dueno()) with check (public.es_dueno());
create policy "solo el dueno borra"    on public.tareas for delete to authenticated using (public.es_dueno());

-- 3) Bucket de archivos (publico para leer; 25 MB por archivo) ---------
insert into storage.buckets (id, name, public, file_size_limit)
values ('portafolio-archivos', 'portafolio-archivos', true, 26214400)
on conflict (id) do update set public = true, file_size_limit = 26214400;

drop policy if exists "dueno ve archivos"   on storage.objects;
drop policy if exists "dueno sube archivos" on storage.objects;
drop policy if exists "dueno borra archivos" on storage.objects;

create policy "dueno ve archivos"    on storage.objects for select to authenticated
  using (bucket_id = 'portafolio-archivos' and public.es_dueno());
create policy "dueno sube archivos"  on storage.objects for insert to authenticated
  with check (bucket_id = 'portafolio-archivos' and public.es_dueno());
create policy "dueno borra archivos" on storage.objects for delete to authenticated
  using (bucket_id = 'portafolio-archivos' and public.
