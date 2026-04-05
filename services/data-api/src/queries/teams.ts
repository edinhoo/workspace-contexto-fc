import { HttpError } from "../http/error.js";
import type { DbClient } from "../types.js";

type TeamFilters = {
  season?: string;
  tournament?: string;
  opponent?: string;
};

export const getTeamContext = async (
  db: DbClient,
  teamId: string,
  filters: TeamFilters,
) => {
  const team = await db
    .selectFrom("core.teams as t")
    .select([
      "t.id as id",
      "t.name as name",
      "t.slug as slug",
      "t.short_name as shortName",
      "t.code3 as code3",
      "t.primary_color as primaryColor",
      "t.secondary_color as secondaryColor",
    ])
    .where("t.id", "=", teamId)
    .executeTakeFirst();

  if (!team) {
    throw new HttpError(404, "team_not_found", "Team not found", {
      teamId,
    });
  }

  let matchesQuery = db
    .selectFrom("core.matches as m")
    .innerJoin("core.tournaments as tr", "tr.id", "m.tournament")
    .innerJoin("core.seasons as s", "s.id", "m.season")
    .innerJoin("core.teams as ht", "ht.id", "m.home_team")
    .innerJoin("core.teams as at", "at.id", "m.away_team")
    .select([
      "m.id as id",
      "m.start_time as startTime",
      "tr.name as tournamentName",
      "s.name as seasonName",
      "m.home_team as homeTeamId",
      "ht.name as homeTeamName",
      "m.away_team as awayTeamId",
      "at.name as awayTeamName",
      "m.home_score_normaltime as homeScore",
      "m.away_score_normaltime as awayScore",
    ])
    .where((eb) =>
      eb.or([eb("m.home_team", "=", teamId), eb("m.away_team", "=", teamId)]),
    );

  if (filters.season) {
    matchesQuery = matchesQuery.where("m.season", "=", filters.season);
  }

  if (filters.tournament) {
    matchesQuery = matchesQuery.where("m.tournament", "=", filters.tournament);
  }

  if (filters.opponent) {
    matchesQuery = matchesQuery.where((eb) =>
      eb.or([
        eb.and([eb("m.home_team", "=", teamId), eb("m.away_team", "=", filters.opponent as string)]),
        eb.and([eb("m.away_team", "=", teamId), eb("m.home_team", "=", filters.opponent as string)]),
      ]),
    );
  }

  const [matches, relatedPlayers] = await Promise.all([
    matchesQuery.orderBy("m.start_time desc").limit(5).execute(),
    db
      .selectFrom("core.lineups as l")
      .innerJoin("core.players as p", "p.id", "l.player")
      .select([
        "p.id as id",
        "p.name as name",
        "p.slug as slug",
        "p.position as position",
      ])
      .where("l.team", "=", teamId)
      .groupBy(["p.id", "p.name", "p.slug", "p.position"])
      .orderBy("p.name asc")
      .limit(10)
      .execute(),
  ]);

  return {
    team,
    filters: {
      season: filters.season ?? null,
      tournament: filters.tournament ?? null,
      opponent: filters.opponent ?? null,
    },
    recentMatches: matches.map((match) => {
      const isHome = match.homeTeamId === teamId;

      return {
        id: match.id,
        startTime: match.startTime.toISOString(),
        tournamentName: match.tournamentName,
        seasonName: match.seasonName,
        opponentId: isHome ? match.awayTeamId : match.homeTeamId,
        opponentName: isHome ? match.awayTeamName : match.homeTeamName,
        side: isHome ? "home" : "away",
        teamScore: isHome ? match.homeScore : match.awayScore,
        opponentScore: isHome ? match.awayScore : match.homeScore,
      };
    }),
    relatedPlayers,
  };
};
