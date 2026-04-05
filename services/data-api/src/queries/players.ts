import { HttpError } from "../http/error.js";
import { buildTeamPerspectiveMatch } from "./shared/team-perspective.js";
import type { DbClient } from "../types.js";

export const getPlayerContext = async (db: DbClient, playerId: string) => {
  const player = await db
    .selectFrom("core.players as p")
    .innerJoin("core.countries as c", "c.id", "p.country")
    .select([
      "p.id as id",
      "p.name as name",
      "p.slug as slug",
      "p.short_name as shortName",
      "p.position as position",
      "c.name as countryName",
      "p.date_of_birth as dateOfBirth",
    ])
    .where("p.id", "=", playerId)
    .executeTakeFirst();

  if (!player) {
    throw new HttpError(404, "player_not_found", "Player not found", {
      playerId,
    });
  }

  const [currentTeams, recentAppearances, statEntries] = await Promise.all([
    db
      .selectFrom("core.player_career_teams as pct")
      .innerJoin("core.teams as t", "t.id", "pct.team")
      .select(["t.id as id", "t.name as name", "t.slug as slug"])
      .where("pct.player", "=", playerId)
      .groupBy(["t.id", "t.name", "t.slug"])
      .orderBy("t.name", "asc")
      .execute(),
    db
      .selectFrom("core.lineups as l")
      .innerJoin("core.matches as m", "m.id", "l.match")
      .innerJoin("core.teams as t", "t.id", "l.team")
      .innerJoin("core.teams as ht", "ht.id", "m.home_team")
      .innerJoin("core.teams as at", "at.id", "m.away_team")
      .select([
        "l.match as matchId",
        "m.start_time as startTime",
        "l.team as teamId",
        "t.name as teamName",
        "m.home_team as homeTeamId",
        "ht.name as homeTeamName",
        "m.away_team as awayTeamId",
        "at.name as awayTeamName",
        "l.minutes_played as minutesPlayed",
        "l.rating as rating",
      ])
      .where("l.player", "=", playerId)
      .orderBy("m.start_time", "desc")
      .limit(5)
      .execute(),
    db
      .selectFrom("core.player_match_stats as pms")
      .innerJoin("core.teams as t", "t.id", "pms.team")
      .select([
        "pms.match as matchId",
        "pms.team as teamId",
        "t.name as teamName",
        "pms.stat_payload as statPayload",
      ])
      .where("pms.player", "=", playerId)
      .orderBy("pms.match", "asc")
      .execute(),
  ]);

  return {
    player,
    currentTeams,
    recentAppearances: recentAppearances.map((appearance) => {
      const perspective = buildTeamPerspectiveMatch({
        referenceTeamId: appearance.teamId,
        homeTeamId: appearance.homeTeamId,
        homeTeamName: appearance.homeTeamName,
        awayTeamId: appearance.awayTeamId,
        awayTeamName: appearance.awayTeamName,
        homeScore: null,
        awayScore: null,
      });

      return {
        matchId: appearance.matchId,
        startTime: appearance.startTime.toISOString(),
        teamId: appearance.teamId,
        teamName: appearance.teamName,
        opponentId: perspective.opponentId,
        opponentName: perspective.opponentName,
        minutesPlayed: appearance.minutesPlayed,
        rating: appearance.rating,
      };
    }),
    statEntries,
  };
};
