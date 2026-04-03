export type AppEnvironment = "development" | "test" | "production";

export type BaseAppConfig = {
  serviceName: string;
  environment: AppEnvironment;
};

export const defineConfig = <TConfig extends BaseAppConfig>(
  config: TConfig
): TConfig => config;
