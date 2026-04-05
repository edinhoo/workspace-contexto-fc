import { z } from "zod";

export const entityIdSchema = z.string().min(1);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
});

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
