/* global process */

const parsePositiveInteger = (value, fallback, label) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsedValue = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${label} deve ser um inteiro positivo.`);
  }

  return parsedValue;
};

export const getResidentSchedulerConfig = (env = process.env) => ({
  pollIntervalMs: parsePositiveInteger(
    env.CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS,
    15000,
    "CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS",
  ),
  idleLogEvery: parsePositiveInteger(
    env.CONTEXTO_FC_SCHEDULER_IDLE_LOG_EVERY,
    4,
    "CONTEXTO_FC_SCHEDULER_IDLE_LOG_EVERY",
  ),
  triggeredBy: env.CONTEXTO_FC_SCHEDULER_TRIGGERED_BY?.trim() || "resident-scheduler",
});
