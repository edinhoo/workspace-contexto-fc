import pg from "pg";

const { Pool } = pg;

let pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.CONTEXTO_FC_DB_HOST ?? "127.0.0.1",
      port: Number(process.env.CONTEXTO_FC_DB_PORT ?? "54329"),
      database: process.env.CONTEXTO_FC_DB_NAME ?? "contexto_fc",
      user: process.env.CONTEXTO_FC_DB_USER ?? "contexto_fc",
      password: process.env.CONTEXTO_FC_DB_PASSWORD ?? "contexto_fc"
    });
  }

  return pool;
};

export const withDbTransaction = async (callback) => {
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // noop
    }

    throw error;
  } finally {
    client.release();
  }
};

export const closeDbPool = async () => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
};
