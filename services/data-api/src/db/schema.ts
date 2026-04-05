export type IngestionRunTable = {
  run_id: string;
  source: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  rows_inserted: number | null;
  rows_updated: number | null;
  rows_skipped: number | null;
  validation_errors: unknown | null;
  warnings: unknown | null;
};

export type Database = {
  "ops.ingestion_runs": IngestionRunTable;
};
