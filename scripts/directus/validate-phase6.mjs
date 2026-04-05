import { directusApi, loginDirectus, psql } from "./_shared.mjs";

const stateId = "phase6-state-sp";
const teamOverrideId = "phase6-team-override-atm";

async function ensureCollection(token, collectionName) {
  const collections = await directusApi("/collections", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return collections.data.some((collection) => collection.collection === collectionName);
}

async function upsertItem(token, collection, tableName, primaryKey, payload) {
  const exists = psql(
    `select 1 from public.${tableName} where id = '${primaryKey}' limit 1;`,
  );

  if (!exists) {
    await directusApi(`/items/${collection}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return "created";
  }

  await directusApi(`/items/${collection}/${primaryKey}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return "updated";
}

async function run() {
  const health = await directusApi("/server/health");
  const token = await loginDirectus();

  const hasPanelStates = await ensureCollection(token, "panel_states");
  const hasPanelTeamOverrides = await ensureCollection(token, "panel_team_overrides");

  if (!hasPanelStates || !hasPanelTeamOverrides) {
    throw new Error("Colecoes da Fase 6 ainda nao foram registradas no Directus.");
  }

  const brazilCountryId = psql("select id from core.countries where name = 'Brazil' limit 1;");
  const firstTeamId = psql("select id from core.teams order by id limit 1;");

  if (!brazilCountryId || !firstTeamId) {
    throw new Error("Base canônica ainda nao tem pais/time suficientes para validar a Fase 6.");
  }

  psql(
    `delete from public.panel_team_overrides where team = '${firstTeamId}' and id <> '${teamOverrideId}';`,
  );

  const stateStatus = await upsertItem(token, "panel_states", "panel_states", stateId, {
    id: stateId,
    slug: "sp-validado",
    name: "Sao Paulo Validado",
    short_name: "SP",
    country: brazilCountryId,
    created_at: "2026-04-05T12:00:00Z",
    updated_at: "2026-04-05T12:10:00Z",
  });

  const overrideStatus = await upsertItem(
    token,
    "panel_team_overrides",
    "panel_team_overrides",
    teamOverrideId,
    {
    id: teamOverrideId,
    team: firstTeamId,
    public_slug: "atletico-mineiro-validado",
    public_label: "Atletico MG Validado",
    is_published: true,
    notes: "Validacao automatizada da fase 6",
    created_at: "2026-04-05T12:05:00Z",
    updated_at: "2026-04-05T12:15:00Z",
    },
  );

  const syncedState = psql(
    `select slug || E'\\t' || name from core.states where id = '${stateId}' limit 1;`,
  );
  const syncedTeamOverride = psql(
    `select public_slug || E'\\t' || public_label from editorial.team_overrides where id = '${teamOverrideId}' limit 1;`,
  );

  if (syncedState !== "sp-validado\tSao Paulo Validado") {
    throw new Error(`Sincronizacao de panel_states falhou: ${syncedState || "sem registro"}`);
  }

  if (syncedTeamOverride !== "atletico-mineiro-validado\tAtletico MG Validado") {
    throw new Error(
      `Sincronizacao de panel_team_overrides falhou: ${syncedTeamOverride || "sem registro"}`,
    );
  }

  console.log(`Health: ${health.status}`);
  console.log(`panel_states: ${stateStatus}`);
  console.log(`panel_team_overrides: ${overrideStatus}`);
  console.log(`core.states: ${syncedState}`);
  console.log(`editorial.team_overrides: ${syncedTeamOverride}`);
}

await run();
