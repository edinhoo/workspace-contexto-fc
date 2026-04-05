import { execFileSync } from "node:child_process";

export const directusUrl = process.env.DIRECTUS_URL ?? "http://127.0.0.1:8055";
export const adminEmail = process.env.DIRECTUS_ADMIN_EMAIL ?? "admin@contextofc.dev";
export const adminPassword = process.env.DIRECTUS_ADMIN_PASSWORD ?? "directus-local-admin";

export async function directusApi(path, options = {}) {
  const response = await fetch(`${directusUrl}${path}`, options);
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(json?.errors?.[0]?.message ?? `Directus respondeu ${response.status}`);
  }

  return json;
}

export async function loginDirectus() {
  const payload = await directusApi("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });

  return payload.data.access_token;
}

export function psql(sql) {
  return execFileSync(
    "docker",
    [
      "compose",
      "-f",
      "infra/docker/docker-compose.yml",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "contexto_fc",
      "-d",
      "contexto_fc",
      "-At",
      "-F",
      "\t",
      "-c",
      sql,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  ).trim();
}
