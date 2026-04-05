create table if not exists ops.planned_matches (
  id text primary key,
  provider text not null,
  provider_event_id text not null,
  scheduled_at timestamptz not null,
  core_match_id text references core.matches(id) on delete set null,
  status text not null check (status in ('planned', 'linked', 'cancelled')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (provider, provider_event_id)
);

create index if not exists idx_ops_planned_matches_scheduled_at
  on ops.planned_matches(scheduled_at);

create index if not exists idx_ops_planned_matches_status
  on ops.planned_matches(status);

create table if not exists ops.scheduled_scrapes (
  id text primary key,
  planned_match_id text not null references ops.planned_matches(id) on delete cascade,
  scheduled_for timestamptz not null,
  pass_number integer not null check (pass_number in (1, 2, 3)),
  status text not null check (status in ('pending', 'running', 'done', 'failed', 'cancelled')),
  triggered_by text not null,
  run_id text references ops.ingestion_runs(run_id) on delete set null,
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempted_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (planned_match_id, pass_number, scheduled_for)
);

create index if not exists idx_ops_scheduled_scrapes_due
  on ops.scheduled_scrapes(status, scheduled_for);

create index if not exists idx_ops_scheduled_scrapes_planned_match_id
  on ops.scheduled_scrapes(planned_match_id);

create index if not exists idx_ops_scheduled_scrapes_run_id
  on ops.scheduled_scrapes(run_id);
