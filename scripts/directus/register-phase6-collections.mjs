const directusUrl = process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
const adminEmail = process.env.DIRECTUS_ADMIN_EMAIL ?? "admin@contextofc.dev";
const adminPassword = process.env.DIRECTUS_ADMIN_PASSWORD ?? "directus-local-admin";

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

async function api(path, options = {}) {
  const response = await fetch(`${directusUrl}${path}`, options);
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(json?.errors?.[0]?.message ?? `Directus respondeu ${response.status}`);
  }

  return json;
}

async function login() {
  const payload = await api("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });

  return payload.data.access_token;
}

async function listCollections(token) {
  const payload = await api("/collections", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return new Set(payload.data.map((collection) => collection.collection));
}

async function ensureCollection(token, collection) {
  await api("/collections", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(collection),
  });
}

async function run() {
  const token = await login();
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
