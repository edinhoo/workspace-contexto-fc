import { z } from "zod";

export const entityIdSchema = z.string().min(1);

const numberLikeSchema = z.union([z.number(), z.string().min(1)]);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// Alguns drivers pg retornam colunas numericas como string dependendo do tipo SQL.
// Este schema normaliza os dois formatos para number no contrato de resposta.
export const nullableNumberFieldSchema = numberLikeSchema
  .transform((value) => Number(value))
  .nullable();

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.literal("healthy"),
  service: z.literal("data-api"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
