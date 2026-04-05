import { HttpError } from "../http/error.js";
import type { DbClient } from "../types.js";

export const getMatchContext = async (db: DbClient, matchId: string) => {
  const match = await db
    .selectFrom("core.matches as m")
    .innerJoin("core.tournaments as t", "t.id", "m.tournament")
    .innerJoin("core.seasons as s", "s.id", "m.season")
    .innerJoin("core.teams as ht", "ht.id", "m.home_team")
    .innerJoin("core.teams as at", "at.id", "m.away_team")
    .leftJoin("core.stadiums as st", "st.id", "m.stadium")
    .leftJoin("core.cities as ct", "ct.id", "st.city")
    .leftJoin("core.referees as r", "r.id", "m.referee")
    .select([
      "m.id as match_id",
      "m.source_ref as match_source_ref",
      "m.start_time as match_start_time",
      "m.round as match_round",
      "m.home_score_normaltime as home_score",
      "m.away_score_normaltime as away_score",
      "t.id as tournament_id",
      "t.name as tournament_name",
      "t.slug as tournament_slug",
      "s.id as season_id",
      "s.name as season_name",
      "s.year as season_year",
      "ht.id as home_team_id",
      "ht.name as home_team_name",
      "ht.slug as home_team_slug",
      "at.id as away_team_id",
      "at.name as away_team_name",
      "at.slug as away_team_slug",
      "st.id as stadium_id",
      "st.name as stadium_name",
      "st.slug as stadium_slug",
      "ct.name as stadium_city_name",
      "r.id as referee_id",
      "r.name as referee_name",
      "r.slug as referee_slug",
    ])
    .where("m.id", "=", matchId)
    .executeTakeFirst();

  if (!match) {
    throw new HttpError(404, "match_not_found", "Match not found", {
      matchId,
    });
  }

  const [lineups, events, teamStats] = await Promise.all([
    db
      .selectFrom("core.lineups as l")
      .innerJoin("core.teams as t", "t.id", "l.team")
      .innerJoin("core.players as p", "p.id", "l.player")
      .select([
        "l.id as id",
        "l.team as teamId",
        "t.name as teamName",
        "l.player as playerId",
        "p.name as playerName",
        "l.position as position",
        "l.jersey_number as jerseyNumber",
        "l.minutes_played as minutesPlayed",
        "l.rating as rating",
      ])
      .where("l.match", "=", matchId)
      .orderBy("t.name asc")
      .orderBy("p.name asc")
      .execute(),
    db
      .selectFrom("core.events as e")
      .leftJoin("core.teams as t", "t.id", "e.team")
      .leftJoin("core.players as p", "p.id", "e.player")
      .leftJoin("core.players as rp", "rp.id", "e.related_player")
      .select([
        "e.id as id",
        "e.sort_order as sortOrder",
        "e.team as teamId",
        "t.name as teamName",
        "e.player as playerId",
        "p.name as playerName",
        "e.related_player as relatedPlayerId",
        "rp.name as relatedPlayerName",
        "e.incident_type as incidentType",
        "e.incident_class as incidentClass",
        "e.minute as minute",
        "e.added_time as addedTime",
        "e.home_score as homeScore",
        "e.away_score as awayScore",
      ])
      .where("e.match", "=", matchId)
      .orderBy("e.sort_order asc")
      .execute(),
    db
      .selectFrom("core.team_match_stats as tms")
      .innerJoin("core.teams as t", "t.id", "tms.team")
      .select([
        "tms.id as id",
        "tms.team as teamId",
        "t.name as teamName",
        "tms.stat_payload as statPayload",
      ])
      .where("tms.match", "=", matchId)
      .orderBy("t.name asc")
      .execute(),
  ]);

  return {
    match: {
      id: match.match_id,
      sourceRef: match.match_source_ref,
      startTime: match.match_start_time.toISOString(),
      round: match.match_round,
    },
    tournament: {
      id: match.tournament_id,
      name: match.tournament_name,
      slug: match.tournament_slug,
    },
    season: {
      id: match.season_id,
      name: match.season_name,
      year: match.season_year,
    },
    homeTeam: {
      id: match.home_team_id,
      name: match.home_team_name,
      slug: match.home_team_slug,
      score: match.home_score,
    },
    awayTeam: {
      id: match.away_team_id,
      name: match.away_team_name,
      slug: match.away_team_slug,
      score: match.away_score,
    },
    stadium: match.stadium_id
      ? {
          id: match.stadium_id,
          name: match.stadium_name as string,
          slug: match.stadium_slug as string,
          cityName: match.stadium_city_name,
        }
      : null,
    referee: match.referee_id
      ? {
          id: match.referee_id,
          name: match.referee_name as string,
          slug: match.referee_slug as string,
        }
      : null,
    lineups,
    events,
    teamStats,
  };
};
