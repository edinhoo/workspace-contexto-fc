alter table core.stadiums
  alter column capacity type integer using nullif(capacity, '')::integer,
  alter column latitude type numeric(9, 6) using nullif(latitude, '')::numeric(9, 6),
  alter column longitude type numeric(9, 6) using nullif(longitude, '')::numeric(9, 6);

alter table staging.stadiums
  alter column capacity type integer using nullif(capacity, '')::integer,
  alter column latitude type numeric(9, 6) using nullif(latitude, '')::numeric(9, 6),
  alter column longitude type numeric(9, 6) using nullif(longitude, '')::numeric(9, 6);

alter table core.matches
  alter column home_score_period_1 type integer using nullif(home_score_period_1, '')::integer,
  alter column home_score_period_2 type integer using nullif(home_score_period_2, '')::integer,
  alter column home_score_normaltime type integer using nullif(home_score_normaltime, '')::integer,
  alter column home_score_extra_1 type integer using nullif(home_score_extra_1, '')::integer,
  alter column home_score_extra_2 type integer using nullif(home_score_extra_2, '')::integer,
  alter column home_score_overtime type integer using nullif(home_score_overtime, '')::integer,
  alter column home_score_penalties type integer using nullif(home_score_penalties, '')::integer,
  alter column away_score_period_1 type integer using nullif(away_score_period_1, '')::integer,
  alter column away_score_period_2 type integer using nullif(away_score_period_2, '')::integer,
  alter column away_score_normaltime type integer using nullif(away_score_normaltime, '')::integer,
  alter column away_score_extra_1 type integer using nullif(away_score_extra_1, '')::integer,
  alter column away_score_extra_2 type integer using nullif(away_score_extra_2, '')::integer,
  alter column away_score_overtime type integer using nullif(away_score_overtime, '')::integer,
  alter column away_score_penalties type integer using nullif(away_score_penalties, '')::integer,
  alter column injury_time_1 type integer using nullif(injury_time_1, '')::integer,
  alter column injury_time_2 type integer using nullif(injury_time_2, '')::integer,
  alter column injury_time_3 type integer using nullif(injury_time_3, '')::integer,
  alter column injury_time_4 type integer using nullif(injury_time_4, '')::integer;

alter table staging.matches
  alter column home_score_period_1 type integer using nullif(home_score_period_1, '')::integer,
  alter column home_score_period_2 type integer using nullif(home_score_period_2, '')::integer,
  alter column home_score_normaltime type integer using nullif(home_score_normaltime, '')::integer,
  alter column home_score_extra_1 type integer using nullif(home_score_extra_1, '')::integer,
  alter column home_score_extra_2 type integer using nullif(home_score_extra_2, '')::integer,
  alter column home_score_overtime type integer using nullif(home_score_overtime, '')::integer,
  alter column home_score_penalties type integer using nullif(home_score_penalties, '')::integer,
  alter column away_score_period_1 type integer using nullif(away_score_period_1, '')::integer,
  alter column away_score_period_2 type integer using nullif(away_score_period_2, '')::integer,
  alter column away_score_normaltime type integer using nullif(away_score_normaltime, '')::integer,
  alter column away_score_extra_1 type integer using nullif(away_score_extra_1, '')::integer,
  alter column away_score_extra_2 type integer using nullif(away_score_extra_2, '')::integer,
  alter column away_score_overtime type integer using nullif(away_score_overtime, '')::integer,
  alter column away_score_penalties type integer using nullif(away_score_penalties, '')::integer,
  alter column injury_time_1 type integer using nullif(injury_time_1, '')::integer,
  alter column injury_time_2 type integer using nullif(injury_time_2, '')::integer,
  alter column injury_time_3 type integer using nullif(injury_time_3, '')::integer,
  alter column injury_time_4 type integer using nullif(injury_time_4, '')::integer;

alter table core.lineups
  alter column jersey_number type integer using nullif(jersey_number, '')::integer,
  alter column minutes_played type integer using nullif(minutes_played, '')::integer,
  alter column rating type numeric(4, 2) using nullif(rating, '')::numeric(4, 2);

alter table staging.lineups
  alter column jersey_number type integer using nullif(jersey_number, '')::integer,
  alter column minutes_played type integer using nullif(minutes_played, '')::integer,
  alter column rating type numeric(4, 2) using nullif(rating, '')::numeric(4, 2);

create index if not exists idx_ops_ingestion_runs_status on ops.ingestion_runs(status);
create index if not exists idx_ops_ingestion_runs_started_at on ops.ingestion_runs(started_at desc);

create index if not exists idx_core_states_country on core.states(country);
create index if not exists idx_core_cities_country on core.cities(country);
create index if not exists idx_core_cities_state on core.cities(state);
create index if not exists idx_core_cities_slug on core.cities(slug);
create index if not exists idx_core_stadiums_city on core.stadiums(city);
create index if not exists idx_core_stadiums_slug on core.stadiums(slug);
create index if not exists idx_core_tournaments_country on core.tournaments(country);
create index if not exists idx_core_tournaments_slug on core.tournaments(slug);
create index if not exists idx_core_seasons_tournament on core.seasons(tournament);
create index if not exists idx_core_seasons_slug on core.seasons(slug);
create index if not exists idx_core_referees_country on core.referees(country);
create index if not exists idx_core_referees_slug on core.referees(slug);
create index if not exists idx_core_managers_country on core.managers(country);
create index if not exists idx_core_managers_slug on core.managers(slug);
create index if not exists idx_core_teams_stadium on core.teams(stadium);
create index if not exists idx_core_teams_slug on core.teams(slug);
create index if not exists idx_core_players_country on core.players(country);
create index if not exists idx_core_players_slug on core.players(slug);
create index if not exists idx_core_matches_tournament on core.matches(tournament);
create index if not exists idx_core_matches_season on core.matches(season);
create index if not exists idx_core_matches_stadium on core.matches(stadium);
create index if not exists idx_core_matches_referee on core.matches(referee);
create index if not exists idx_core_matches_home_team on core.matches(home_team);
create index if not exists idx_core_matches_away_team on core.matches(away_team);
create index if not exists idx_core_matches_start_time on core.matches(start_time desc);
create index if not exists idx_core_lineups_match on core.lineups(match);
create index if not exists idx_core_lineups_team on core.lineups(team);
create index if not exists idx_core_lineups_player on core.lineups(player);
create index if not exists idx_core_player_match_stats_match on core.player_match_stats(match);
create index if not exists idx_core_player_match_stats_team on core.player_match_stats(team);
create index if not exists idx_core_player_match_stats_player on core.player_match_stats(player);
create index if not exists idx_core_team_match_stats_match on core.team_match_stats(match);
create index if not exists idx_core_team_match_stats_team on core.team_match_stats(team);
create index if not exists idx_core_events_match on core.events(match);
create index if not exists idx_core_events_team on core.events(team);
create index if not exists idx_core_events_player on core.events(player);
create index if not exists idx_core_events_related_player on core.events(related_player);
create index if not exists idx_core_events_manager on core.events(manager);
create index if not exists idx_core_events_incident_type on core.events(incident_type);
create index if not exists idx_core_player_career_teams_player on core.player_career_teams(player);
create index if not exists idx_core_player_career_teams_team on core.player_career_teams(team);

create index if not exists idx_staging_countries_run_id on staging.countries(run_id);
create index if not exists idx_staging_cities_run_id on staging.cities(run_id);
create index if not exists idx_staging_stadiums_run_id on staging.stadiums(run_id);
create index if not exists idx_staging_tournaments_run_id on staging.tournaments(run_id);
create index if not exists idx_staging_seasons_run_id on staging.seasons(run_id);
create index if not exists idx_staging_referees_run_id on staging.referees(run_id);
create index if not exists idx_staging_managers_run_id on staging.managers(run_id);
create index if not exists idx_staging_teams_run_id on staging.teams(run_id);
create index if not exists idx_staging_players_run_id on staging.players(run_id);
create index if not exists idx_staging_matches_run_id on staging.matches(run_id);
create index if not exists idx_staging_lineups_run_id on staging.lineups(run_id);
create index if not exists idx_staging_events_run_id on staging.events(run_id);
create index if not exists idx_staging_player_career_teams_run_id on staging.player_career_teams(run_id);
create index if not exists idx_staging_player_match_stats_run_id on staging.player_match_stats(run_id);
create index if not exists idx_staging_team_match_stats_run_id on staging.team_match_stats(run_id);
