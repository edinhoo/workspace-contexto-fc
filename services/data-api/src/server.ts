import { createApp } from "./app.js";
import { getConfig } from "./config.js";

const start = async (): Promise<void> => {
  const config = getConfig();
  const app = createApp();

  try {
    await app.listen({
      host: config.host,
      port: config.port,
    });

    console.info(JSON.stringify({
      event: "data_api_started",
      host: config.host,
      port: config.port,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      event: "data_api_start_failed",
      error: error instanceof Error ? error.message : "unknown_error",
    }));

    process.exitCode = 1;
  }
};

void start();
