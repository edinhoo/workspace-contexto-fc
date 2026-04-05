import { directusApi, loginDirectus } from "./_shared.mjs";

const phase6Collections = [
  {
    collection: "panel_states",
    meta: {
      icon: "flag",
      note: "Superficie operacional do painel sincronizada para core.states",
    },
  },
  {
    collection: "panel_team_overrides",
    meta: {
      icon: "edit_note",
      note: "Superficie operacional do painel sincronizada para editorial.team_overrides",
    },
  },
];

async function listCollections(token) {
  const payload = await directusApi("/collections", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return new Set(payload.data.map((collection) => collection.collection));
}

async function ensureCollection(token, collection) {
  await directusApi("/collections", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(collection),
  });
}

async function run() {
  const token = await loginDirectus();
  const existingCollections = await listCollections(token);
  let created = 0;

  for (const collection of phase6Collections) {
    if (existingCollections.has(collection.collection)) {
      continue;
    }

    await ensureCollection(token, collection);
    created += 1;
    console.log(`Colecao registrada no Directus: ${collection.collection}`);
  }

  if (created === 0) {
    console.log("Colecoes da Fase 6 ja estavam registradas no Directus.");
  }
}

await run();
