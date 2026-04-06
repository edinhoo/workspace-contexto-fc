import { z } from "zod";

import { entityIdSchema, nullableNumberFieldSchema } from "./common.js";

export const seasonParamsSchema = z.object({
  id: entityIdSchema,
});

export const seasonResponseSchema = z.object({
  season: z.object({
    id: z.string(),
    name: z.string(),
    year: z.string().nullable(),
  }),
  tournament: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  recentMatches: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      startTime: z.string(),
      homeTeamId: z.string(),
      homeTeamName: z.string(),
      homeTeamSlug: z.string(),
      awayTeamId: z.string(),
      awayTeamName: z.string(),
      awayTeamSlug: z.string(),
      homeScore: nullableNumberFieldSchema,
      awayScore: nullableNumberFieldSchema,
      round: z.string().nullable(),
    }),
  ),
});

export type SeasonParams = z.infer<typeof seasonParamsSchema>;
export type SeasonResponse = z.infer<typeof seasonResponseSchema>;
