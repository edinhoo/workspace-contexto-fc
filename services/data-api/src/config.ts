const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export type DataApiConfig = {
  host: string;
  port: number;
  databaseUrl: string;
};

const defaultDatabaseUrl =
  "postgresql://contexto_fc:contexto_fc@127.0.0.1:54329/contexto_fc";

export const getConfig = (): DataApiConfig => {
  return {
    host: process.env.DATA_API_HOST ?? "127.0.0.1",
    port: parsePort(process.env.DATA_API_PORT, 3100),
    databaseUrl: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  };
};
