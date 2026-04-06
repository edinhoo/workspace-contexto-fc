import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../app.js";
import { matchResponseSchema } from "../contracts/matches.js";
import { playerResponseSchema } from "../contracts/players.js";
import { seasonResponseSchema } from "../contracts/seasons.js";
import { searchResponseSchema } from "../contracts/search.js";
import { teamResponseSchema } from "../contracts/teams.js";
import { tournamentResponseSchema } from "../contracts/tournaments.js";
import { createDb } from "../db/client.js";

const integrationEnabled = process.env.DATA_API_ENABLE_DB_TESTS === "1";

const runIntegrationTest = integrationEnabled ? test : test.skip;

const fixtureRefs = {
  matchSourceRef: "15237889",
  teamSourceRef: "1977",
  playerSourceRef: "559036",
};

const resolveFixtureIds = async () => {
  const db = createDb();

  try {
    const [match, team, player] = await Promise.all([
      db
        .selectFrom("core.matches")
        .select(["id", "tournament", "season"])
        .where("source_ref", "=", fixtureRefs.matchSourceRef)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom("core.teams")
        .select(["id"])
        .where("source_ref", "=", fixtureRefs.teamSourceRef)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom("core.players")
        .select(["id"])
        .where("source_ref", "=", fixtureRefs.playerSourceRef)
        .executeTakeFirstOrThrow(),
    ]);

    return {
      match: match.id,
      team: team.id,
      player: player.id,
      tournament: match.tournament,
      season: match.season,
    };
  } finally {
    await db.destroy();
  }
};

runIntegrationTest("GET /search retorna itens mistos com discriminador estavel", async (t) => {
  const app = createApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/search?q=palmeiras&limit=5",
  });

  assert.equal(response.statusCode, 200);

  const payload = searchResponseSchema.parse(response.json());

  assert.equal(payload.query, "palmeiras");
  assert.ok(payload.items.length > 0);
  assert.ok(payload.items.every((item) => ["match", "team", "player"].includes(item.type)));
});

runIntegrationTest("GET /matches/:id retorna contexto completo de partida", async (t) => {
  const fixtureIds = await resolveFixtureIds();
  const app = createApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: `/matches/${fixtureIds.match}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = matchResponseSchema.parse(response.json());

  assert.equal(payload.match.id, fixtureIds.match);
  assert.ok(payload.lineups.length > 0);
  assert.ok(payload.events.length > 0);
});

runIntegrationTest("GET /teams/:id retorna contexto focal de equipe", async (t) => {
  const fixtureIds = await resolveFixtureIds();
  const app = createApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: `/teams/${fixtureIds.team}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = teamResponseSchema.parse(response.json());

  assert.equal(payload.team.id, fixtureIds.team);
  assert.ok(Array.isArray(payload.recentMatches));
  assert.ok(Array.isArray(payload.relatedPlayers));
});

runIntegrationTest("GET /players/:id retorna contexto focal de jogador", async (t) => {
  const fixtureIds = await resolveFixtureIds();
  const app = createApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: `/players/${fixtureIds.player}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = playerResponseSchema.parse(response.json());

  assert.equal(payload.player.id, fixtureIds.player);
  assert.ok(Array.isArray(payload.currentTeams));
  assert.ok(Array.isArray(payload.statEntries));
});

runIntegrationTest("GET /tournaments/by-slug/:slug retorna contexto minimo de torneio", async (t) => {
  const fixtureIds = await resolveFixtureIds();
  const db = createDb();
  const app = createApp(db);

  const tournament = await db
    .selectFrom("core.tournaments")
    .select(["slug"])
    .where("id", "=", fixtureIds.tournament)
    .executeTakeFirstOrThrow();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: `/tournaments/by-slug/${tournament.slug}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = tournamentResponseSchema.parse(response.json());

  assert.equal(payload.tournament.slug, tournament.slug);
  assert.ok(Array.isArray(payload.seasons));
  assert.ok(Array.isArray(payload.recentMatches));
});

runIntegrationTest("GET /seasons/:id retorna contexto minimo de temporada", async (t) => {
  const fixtureIds = await resolveFixtureIds();
  const app = createApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: `/seasons/${fixtureIds.season}`,
  });

  assert.equal(response.statusCode, 200);

  const payload = seasonResponseSchema.parse(response.json());

  assert.equal(payload.season.id, fixtureIds.season);
  assert.equal(typeof payload.tournament.slug, "string");
  assert.ok(Array.isArray(payload.recentMatches));
});
