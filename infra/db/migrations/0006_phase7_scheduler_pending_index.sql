create index if not exists idx_ops_scheduled_scrapes_pending_due_order
  on ops.scheduled_scrapes(scheduled_for, pass_number)
  where status = 'pending';
