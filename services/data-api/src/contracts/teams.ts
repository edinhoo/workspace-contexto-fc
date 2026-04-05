import { z } from "zod";

import { entityIdSchema } from "./common.js";

export const teamParamsSchema = z.object({
  id: entityIdSchema,
});

export const teamQuerySchema = z.object({
  season: z.string().optional(),
  tournament: z.string().optional(),
  opponent: z.string().optional(),
});

export const teamResponseSchema = z.object({
  team: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    shortName: z.string().nullable(),
    code3: z.string().nullable(),
    primaryColor: z.string().nullable(),
    secondaryColor: z.string().nullable(),
  }),
  filters: z.object({
    season: z.string().nullable(),
    tournament: z.string().nullable(),
    opponent: z.string().nullable(),
  }),
  recentMatches: z.array(
    z.object({
      id: z.string(),
      startTime: z.string(),
      tournamentName: z.string(),
      seasonName: z.string(),
      opponentId: z.string(),
      opponentName: z.string(),
      side: z.enum(["home", "away"]),
      teamScore: z.string().nullable(),
      opponentScore: z.string().nullable(),
    }),
  ),
  relatedPlayers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      position: z.string().nullable(),
    }),
  ),
});

export type TeamParams = z.infer<typeof teamParamsSchema>;
export type TeamQuery = z.infer<typeof teamQuerySchema>;
export type TeamResponse = z.infer<typeof teamResponseSchema>;
