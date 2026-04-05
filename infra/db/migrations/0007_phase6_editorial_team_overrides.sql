create table if not exists editorial.team_overrides (
  id text primary key,
  team text not null unique references core.teams(id) on delete cascade,
  public_slug text,
  public_label text,
  is_published boolean not null default true,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_editorial_team_overrides_team
  on editorial.team_overrides(team);

grant select, insert, update, delete on editorial.team_overrides to directus_app;
