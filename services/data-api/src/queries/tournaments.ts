import { HttpError } from "../http/error.js";
import { buildMatchSlug } from "./shared/match-slug.js";
import type { DbClient } from "../types.js";

export const getTournamentContextBySlug = async (
  db: DbClient,
  slug: string,
) => {
  const tournament = await db
    .selectFrom("core.tournaments as t")
    .select([
      "t.id as id",
      "t.name as name",
      "t.slug as slug",
    ])
    .where("t.slug", "=", slug)
    .executeTakeFirst();

  if (!tournament) {
    throw new HttpError(404, "tournament_not_found", "Tournament not found", {
      slug,
    });
  }

  const [seasons, recentMatches] = await Promise.all([
    db
      .selectFrom("core.matches as m")
      .innerJoin("core.seasons as s", "s.id", "m.season")
      .select([
        "s.id as id",
        "s.name as name",
        "s.year as year",
      ])
      .where("m.tournament", "=", tournament.id)
      .groupBy(["s.id", "s.name", "s.year"])
      .orderBy("s.year", "desc")
      .orderBy("s.name", "desc")
      .execute(),
    db
      .selectFrom("core.matches as m")
      .innerJoin("core.seasons as s", "s.id", "m.season")
      .innerJoin("core.teams as ht", "ht.id", "m.home_team")
      .innerJoin("core.teams as at", "at.id", "m.away_team")
      .select([
        "m.id as id",
        "m.start_time as startTime",
        "m.home_team as homeTeamId",
        "ht.name as homeTeamName",
        "ht.slug as homeTeamSlug",
        "m.away_team as awayTeamId",
        "at.name as awayTeamName",
        "at.slug as awayTeamSlug",
        "m.home_score_normaltime as homeScore",
        "m.away_score_normaltime as awayScore",
        "s.name as seasonName",
      ])
      .where("m.tournament", "=", tournament.id)
      .orderBy("m.start_time", "desc")
      .limit(10)
      .execute(),
  ]);

  return {
    tournament,
    seasons,
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
      seasonName: match.seasonName,
    })),
  };
};
