import test from "node:test";
import assert from "node:assert/strict";

import { getResidentSchedulerConfig } from "./config.mjs";

test("returns defaults when no env overrides are present", () => {
  const config = getResidentSchedulerConfig({});

  assert.equal(config.pollIntervalMs, 15000);
  assert.equal(config.idleLogEvery, 4);
  assert.equal(config.triggeredBy, "resident-scheduler");
});

test("parses integer env overrides", () => {
  const config = getResidentSchedulerConfig({
    CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS: "1000",
    CONTEXTO_FC_SCHEDULER_IDLE_LOG_EVERY: "2",
    CONTEXTO_FC_SCHEDULER_TRIGGERED_BY: "custom-worker",
  });

  assert.equal(config.pollIntervalMs, 1000);
  assert.equal(config.idleLogEvery, 2);
  assert.equal(config.triggeredBy, "custom-worker");
});

test("throws on invalid integer env overrides", () => {
  assert.throws(
    () =>
      getResidentSchedulerConfig({
        CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS: "zero",
      }),
    /CONTEXTO_FC_SCHEDULER_POLL_INTERVAL_MS/,
  );
});
