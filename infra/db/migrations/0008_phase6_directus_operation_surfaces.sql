create table if not exists public.panel_states (
  id text primary key,
  slug text not null unique,
  name text not null,
  short_name text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.panel_team_overrides (
  id text primary key,
  team text not null unique references core.teams(id) on delete cascade,
  public_slug text,
  public_label text,
  is_published boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.panel_states (id, slug, name, short_name, country, created_at, updated_at)
select id, slug, name, short_name, country, created_at, updated_at
from core.states
on conflict (id) do nothing;

insert into public.panel_team_overrides (
  id,
  team,
  public_slug,
  public_label,
  is_published,
  notes,
  created_at,
  updated_at
)
select
  id,
  team,
  public_slug,
  public_label,
  is_published,
  notes,
  created_at,
  updated_at
from editorial.team_overrides
on conflict (id) do nothing;

create or replace function public.sync_panel_states_to_core()
returns trigger
language plpgsql
security definer
set search_path = public, core
as $$
begin
  insert into core.states (
    id,
    slug,
    name,
    short_name,
    country,
    created_at,
    updated_at
  ) values (
    new.id,
    new.slug,
    new.name,
    new.short_name,
    new.country,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (id) do update
  set slug = excluded.slug,
      name = excluded.name,
      short_name = excluded.short_name,
      country = excluded.country,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

create or replace function public.sync_panel_team_overrides_to_editorial()
returns trigger
language plpgsql
security definer
set search_path = public, editorial, core
as $$
begin
  if tg_op = 'DELETE' then
    delete from editorial.team_overrides
    where id = old.id;

    return old;
  end if;

  insert into editorial.team_overrides (
    id,
    team,
    public_slug,
    public_label,
    is_published,
    notes,
    created_at,
    updated_at
  ) values (
    new.id,
    new.team,
    new.public_slug,
    new.public_label,
    new.is_published,
    new.notes,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (id) do update
  set team = excluded.team,
      public_slug = excluded.public_slug,
      public_label = excluded.public_label,
      is_published = excluded.is_published,
      notes = excluded.notes,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

drop trigger if exists trg_sync_panel_states_to_core on public.panel_states;
create trigger trg_sync_panel_states_to_core
after insert or update on public.panel_states
for each row
execute function public.sync_panel_states_to_core();

drop trigger if exists trg_sync_panel_team_overrides_to_editorial on public.panel_team_overrides;
create trigger trg_sync_panel_team_overrides_to_editorial
after insert or update or delete on public.panel_team_overrides
for each row
execute function public.sync_panel_team_overrides_to_editorial();

grant select, insert, update on public.panel_states to directus_app;
grant select, insert, update, delete on public.panel_team_overrides to directus_app;
