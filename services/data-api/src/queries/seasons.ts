import { HttpError } from "../http/error.js";
import { buildMatchSlug } from "./shared/match-slug.js";
import type { DbClient } from "../types.js";

export const getSeasonContext = async (db: DbClient, seasonId: string) => {
  const season = await db
    .selectFrom("core.seasons as s")
    .select([
      "s.id as id",
      "s.name as name",
      "s.year as year",
      "s.tournament as tournamentId",
    ])
    .where("s.id", "=", seasonId)
    .executeTakeFirst();

  if (!season) {
    throw new HttpError(404, "season_not_found", "Season not found", {
      seasonId,
    });
  }

  const [tournament, recentMatches] = await Promise.all([
    db
      .selectFrom("core.tournaments as t")
      .select([
        "t.id as id",
        "t.name as name",
        "t.slug as slug",
      ])
      .where("t.id", "=", season.tournamentId)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("core.matches as m")
      .innerJoin("core.teams as ht", "ht.id", "m.home_team")
      .innerJoin("core.teams as at", "at.id", "m.away_team")
      .select([
        "m.id as id",
        "m.start_time as startTime",
        "m.round as round",
        "m.home_team as homeTeamId",
        "ht.name as homeTeamName",
        "ht.slug as homeTeamSlug",
        "m.away_team as awayTeamId",
        "at.name as awayTeamName",
        "at.slug as awayTeamSlug",
        "m.home_score_normaltime as homeScore",
        "m.away_score_normaltime as awayScore",
      ])
      .where("m.season", "=", seasonId)
      .orderBy("m.start_time", "desc")
      .limit(10)
      .execute(),
  ]);

  return {
    season: {
      id: season.id,
      name: season.name,
      year: season.year,
    },
    tournament,
    recentMatches: recentMatches.map((match) => ({
      id: match.id,
      slug: buildMatchSlug({
        homeTeamSlug: match.homeTeamSlug,
        awayTeamSlug: match.awayTeamSlug,
        startTime: match.startTime,
      }),
      startTime: match.startTime.toISOString(),
      homeTeamId: match.homeTeamId,
      homeTeamName: match.homeTeamName,
      homeTeamSlug: match.homeTeamSlug,
      awayTeamId: match.awayTeamId,
      awayTeamName: match.awayTeamName,
      awayTeamSlug: match.awayTeamSlug,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      round: match.round,
    })),
  };
};
