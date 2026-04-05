create table if not exists ops.ingestion_run_details (
  id text primary key,
  run_id text not null references ops.ingestion_runs(run_id) on delete cascade,
  entity text not null,
  rows_seen integer not null,
  rows_valid integer not null,
  rows_invalid integer not null,
  rows_inserted integer not null,
  rows_updated integer not null,
  rows_skipped integer not null,
  warnings jsonb,
  validation_errors jsonb,
  created_at timestamptz not null,
  unique (run_id, entity)
);

create index if not exists idx_ops_ingestion_run_details_run_id
  on ops.ingestion_run_details(run_id);

create index if not exists idx_ops_ingestion_run_details_entity
  on ops.ingestion_run_details(entity);
