import { z } from "zod";

import { entityIdSchema } from "./common.js";

export const matchParamsSchema = z.object({
  id: entityIdSchema,
});

export const matchResponseSchema = z.object({
  match: z.object({
    id: z.string(),
    sourceRef: z.string(),
    startTime: z.string(),
    round: z.string().nullable(),
  }),
  tournament: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  season: z.object({
    id: z.string(),
    name: z.string(),
    year: z.string().nullable(),
  }),
  homeTeam: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    score: z.string().nullable(),
  }),
  awayTeam: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    score: z.string().nullable(),
  }),
  stadium: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      cityName: z.string().nullable(),
    })
    .nullable(),
  referee: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  lineups: z.array(
    z.object({
      id: z.string(),
      teamId: z.string(),
      teamName: z.string(),
      playerId: z.string(),
      playerName: z.string(),
      position: z.string().nullable(),
      jerseyNumber: z.string().nullable(),
      minutesPlayed: z.string().nullable(),
      rating: z.string().nullable(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.string().nullable(),
      teamId: z.string().nullable(),
      teamName: z.string().nullable(),
      playerId: z.string().nullable(),
      playerName: z.string().nullable(),
      relatedPlayerId: z.string().nullable(),
      relatedPlayerName: z.string().nullable(),
      incidentType: z.string(),
      incidentClass: z.string().nullable(),
      minute: z.string().nullable(),
      addedTime: z.string().nullable(),
      homeScore: z.string().nullable(),
      awayScore: z.string().nullable(),
    }),
  ),
  teamStats: z.array(
    z.object({
      id: z.string(),
      teamId: z.string(),
      teamName: z.string(),
      statPayload: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type MatchParams = z.infer<typeof matchParamsSchema>;
export type MatchResponse = z.infer<typeof matchResponseSchema>;
