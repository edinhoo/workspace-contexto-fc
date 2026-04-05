import { ZodType } from "zod";

import { HttpError } from "./error.js";

const parseWithSchema = <T>(schema: ZodType<T>, value: unknown, label: string): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new HttpError(400, "validation_error", `Invalid ${label}`, {
      issues: result.error.issues,
    });
  }

  return result.data;
};

export const parseParams = <T>(schema: ZodType<T>, value: unknown): T => {
  return parseWithSchema(schema, value, "route params");
};

export const parseQuery = <T>(schema: ZodType<T>, value: unknown): T => {
  return parseWithSchema(schema, value, "query string");
};
