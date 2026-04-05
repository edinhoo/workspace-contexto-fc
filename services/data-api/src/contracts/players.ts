import { z } from "zod";

import { entityIdSchema, nullableNumberFieldSchema } from "./common.js";

export const playerParamsSchema = z.object({
  id: entityIdSchema,
});

export const playerResponseSchema = z.object({
  player: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    shortName: z.string().nullable(),
    position: z.string().nullable(),
    countryName: z.string(),
    dateOfBirth: z.string().nullable(),
  }),
  currentTeams: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    }),
  ),
  recentAppearances: z.array(
    z.object({
      matchId: z.string(),
      startTime: z.string(),
      teamId: z.string(),
      teamName: z.string(),
      opponentId: z.string(),
      opponentName: z.string(),
      minutesPlayed: nullableNumberFieldSchema,
      rating: nullableNumberFieldSchema,
    }),
  ),
  statEntries: z.array(
    z.object({
      matchId: z.string(),
      teamId: z.string(),
      teamName: z.string(),
      statPayload: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type PlayerParams = z.infer<typeof playerParamsSchema>;
export type PlayerResponse = z.infer<typeof playerResponseSchema>;
