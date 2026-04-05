import { randomUUID } from "node:crypto";

import { createTempSqlFile, runPsqlFile, runPsqlQuery } from "../_shared.mjs";
import { sqlLiteral } from "../pipeline/source-data.mjs";

export const PASS_OFFSETS_MINUTES = [150, 180, 210];
export const MAX_AUTOMATIC_RETRIES = 2;

const parseRows = (output) =>
  output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));

export const parseTimestampArg = (value) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Data invalida: ${value}`);
  }

  return parsedDate;
};

export const buildScheduledPasses = (scheduledAt) =>
  PASS_OFFSETS_MINUTES.map((offsetInMinutes, index) => ({
    id: `scheduled-scrape-${randomUUID()}`,
    passNumber: index + 1,
    scheduledFor: new Date(scheduledAt.getTime() + offsetInMinutes * 60 * 1000).toISOString()
  }));

export const getPlannedMatchByProviderEventId = ({ provider, providerEventId }) => {
  const rows = parseRows(
    runPsqlQuery(`
      select
        id,
        provider,
        provider_event_id,
        scheduled_at::text,
        coalesce(core_match_id, ''),
        status,
        created_at::text,
        updated_at::text
      from ops.planned_matches
      where provider = ${sqlLiteral(provider)}
        and provider_event_id = ${sqlLiteral(providerEventId)}
      limit 1;
    `)
  );

  if (rows.length === 0) {
    return null;
  }

  const [id, rowProvider, rowProviderEventId, scheduledAt, coreMatchId, status, createdAt, updatedAt] =
    rows[0];

  return {
    id,
    provider: rowProvider,
    providerEventId: rowProviderEventId,
    scheduledAt,
    coreMatchId: coreMatchId || null,
    status,
    createdAt,
    updatedAt
  };
};

export const getScheduledScrapesForPlannedMatch = (plannedMatchId) =>
  parseRows(
    runPsqlQuery(`
      select
        id,
        pass_number::text,
        scheduled_for::text,
        status,
        coalesce(run_id, ''),
        attempt_count::text
      from ops.scheduled_scrapes
      where planned_match_id = ${sqlLiteral(plannedMatchId)}
      order by scheduled_for asc, pass_number asc;
    `)
  ).map(([id, passNumber, scheduledFor, status, runId, attemptCount]) => ({
    id,
    passNumber: Number(passNumber),
    scheduledFor,
    status,
    runId: runId || null,
    attemptCount: Number(attemptCount)
  }));

const buildInsertScheduledScrapesSql = ({ plannedMatchId, scheduledAt, triggeredBy }) =>
  buildScheduledPasses(scheduledAt)
    .map(
      ({ id, passNumber, scheduledFor }) => `
insert into ops.scheduled_scrapes (
  id,
  planned_match_id,
  scheduled_for,
  pass_number,
  status,
  triggered_by,
  attempt_count,
  created_at,
  updated_at
) values (
  ${sqlLiteral(id)},
  ${sqlLiteral(plannedMatchId)},
  ${sqlLiteral(scheduledFor)}::timestamptz,
  ${passNumber},
  'pending',
  ${sqlLiteral(triggeredBy)},
  0,
  now(),
  now()
);
`
    )
    .join("\n");

export const upsertPlannedMatchSchedule = ({
  provider,
  providerEventId,
  scheduledAt,
  triggeredBy = "cli"
}) => {
  const existingPlannedMatch = getPlannedMatchByProviderEventId({ provider, providerEventId });
  const normalizedScheduledAt = scheduledAt.toISOString();
  const plannedMatchId = existingPlannedMatch?.id ?? `planned-match-${randomUUID()}`;
  const scheduledAtChanged =
    existingPlannedMatch !== null && existingPlannedMatch.scheduledAt !== normalizedScheduledAt;

  const sql = existingPlannedMatch
    ? `
begin;

update ops.planned_matches
set
  scheduled_at = ${sqlLiteral(normalizedScheduledAt)}::timestamptz,
  status = case when core_match_id is not null then 'linked' else 'planned' end,
  updated_at = now()
where id = ${sqlLiteral(existingPlannedMatch.id)};

${scheduledAtChanged ? `
update ops.scheduled_scrapes
set
  status = 'cancelled',
  finished_at = coalesce(finished_at, now()),
  updated_at = now()
where planned_match_id = ${sqlLiteral(existingPlannedMatch.id)}
  and status = 'pending';

${buildInsertScheduledScrapesSql({
  plannedMatchId: existingPlannedMatch.id,
  scheduledAt,
  triggeredBy
})}
` : ""}

commit;
`
    : `
begin;

insert into ops.planned_matches (
  id,
  provider,
  provider_event_id,
  scheduled_at,
  status,
  created_at,
  updated_at
) values (
  ${sqlLiteral(plannedMatchId)},
  ${sqlLiteral(provider)},
  ${sqlLiteral(providerEventId)},
  ${sqlLiteral(normalizedScheduledAt)}::timestamptz,
  'planned',
  now(),
  now()
);

${buildInsertScheduledScrapesSql({
  plannedMatchId,
  scheduledAt,
  triggeredBy
})}

commit;
`;

  const sqlFile = createTempSqlFile("contexto-fc-phase5-plan-match", sql);

  try {
    runPsqlFile(sqlFile.filePath);
  } finally {
    sqlFile.cleanup();
  }

  const plannedMatch =
    getPlannedMatchByProviderEventId({
      provider,
      providerEventId
    }) ?? existingPlannedMatch;

  if (!plannedMatch) {
    throw new Error("Falha ao localizar a partida planejada apos o agendamento.");
  }

  return {
    action: existingPlannedMatch ? (scheduledAtChanged ? "rescheduled" : "unchanged") : "created",
    plannedMatch,
    scheduledScrapes: getScheduledScrapesForPlannedMatch(plannedMatch.id)
  };
};
