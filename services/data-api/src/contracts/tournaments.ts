import { z } from "zod";

import { entitySlugSchema, nullableNumberFieldSchema } from "./common.js";

export const tournamentSlugParamsSchema = z.object({
  slug: entitySlugSchema,
});

export const tournamentResponseSchema = z.object({
  tournament: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  seasons: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      year: z.string().nullable(),
    }),
  ),
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
      seasonName: z.string(),
    }),
  ),
});

export type TournamentSlugParams = z.infer<typeof tournamentSlugParamsSchema>;
export type TournamentResponse = z.infer<typeof tournamentResponseSchema>;
