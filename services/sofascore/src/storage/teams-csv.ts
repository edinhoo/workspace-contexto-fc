import { slugify } from "@repo/utils";

import type { StadiumRecord, TeamRecord } from "../types.js";
import { compareEntityIds, createEntityId, loadCsvRows, saveCsvRows } from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;code3;short_name;complete_name;stadium;foundation;primary_color;secondary_color;text_color;edited";

export const loadTeams = async (filePath: string): Promise<TeamRecord[]> => {
  const { header, rows } = await loadCsvRows(filePath);

  if (!header || rows.length === 0) {
    return [];
  }

  return sortTeams(rows.map((row) => normalizeTeamRow(header, row)));
};

export const upsertTeams = (
  existingTeams: TeamRecord[],
  incomingTeams: TeamRecord[]
): TeamRecord[] => {
  const teams = [...existingTeams];

  for (const incomingTeam of incomingTeams) {
    const existingTeamIndex = teams.findIndex(
      (existingTeam) => existingTeam.slug === incomingTeam.slug && existingTeam.name === incomingTeam.name
    );

    if (existingTeamIndex === -1) {
      teams.push(createTeam(incomingTeam));
      continue;
    }

    teams[existingTeamIndex] = syncTeam(teams[existingTeamIndex], incomingTeam);
  }

  return sortTeams(teams);
};

export const relinkTeamStadiums = (
  teams: TeamRecord[],
  stadiums: StadiumRecord[]
): TeamRecord[] =>
  sortTeams(
    teams.map((team) => {
      const linkedStadium = stadiums.find(
        (stadium) => stadium.id === team.stadium || stadium.source_id === team.stadium
      );

      if (!linkedStadium) {
        return team;
      }

      return finalizeTeam({
        ...team,
        stadium: linkedStadium.id
      });
    })
  );

export const saveTeams = async (filePath: string, teams: TeamRecord[]): Promise<void> => {
  const rows = sortTeams(teams).map((team) =>
    [
      team.id,
      team.slug,
      team.name,
      team.code3,
      team.short_name,
      team.complete_name,
      team.stadium,
      team.foundation,
      team.primary_color,
      team.secondary_color,
      team.text_color,
      String(team.edited)
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeTeamRow = (header: string, row: string): TeamRecord => {
  const columns = row.split(";");

  const [
    id = "",
    slug = "",
    name = "",
    code3 = "",
    short_name = "",
    complete_name = "",
    stadium = "",
    foundation = "",
    primary_color = "",
    secondary_color = "",
    text_color = "",
    edited = "false"
  ] = columns;

  if (header === CSV_HEADER) {
    return finalizeTeam({
      id,
      slug,
      name,
      code3,
      short_name,
      complete_name,
      stadium,
      foundation,
      primary_color,
      secondary_color,
      text_color,
      edited: edited === "true"
    });
  }

  return finalizeTeam({
    id,
    slug,
    name,
    code3,
    short_name: short_name || name,
    complete_name: complete_name || name,
    stadium,
    foundation,
    primary_color,
    secondary_color,
    text_color,
    edited: edited === "true"
  });
};

const createTeam = (team: TeamRecord): TeamRecord =>
  finalizeTeam({
    id: createEntityId(),
    slug: team.slug,
    name: team.name,
    code3: team.code3,
    short_name: team.short_name,
    complete_name: team.complete_name,
    stadium: team.stadium,
    foundation: team.foundation,
    primary_color: team.primary_color,
    secondary_color: team.secondary_color,
    text_color: team.text_color,
    edited: false
  });

const syncTeam = (existingTeam: TeamRecord, incomingTeam: TeamRecord): TeamRecord => {
  if (existingTeam.edited) {
    return finalizeTeam({
      ...existingTeam,
      stadium: incomingTeam.stadium
    });
  }

  return finalizeTeam({
    ...existingTeam,
    slug: incomingTeam.slug,
    name: incomingTeam.name,
    code3: incomingTeam.code3,
    short_name: incomingTeam.short_name,
    complete_name: incomingTeam.complete_name,
    stadium: incomingTeam.stadium,
    foundation: incomingTeam.foundation,
    primary_color: incomingTeam.primary_color,
    secondary_color: incomingTeam.secondary_color,
    text_color: incomingTeam.text_color
  });
};

const finalizeTeam = (team: TeamRecord): TeamRecord => ({
  id: team.id.trim() || createEntityId(),
  slug: slugify(team.name.trim() || team.slug.trim()),
  name: team.name.trim(),
  code3: team.code3.trim(),
  short_name: team.short_name.trim(),
  complete_name: team.complete_name.trim(),
  stadium: team.stadium.trim(),
  foundation: team.foundation.trim(),
  primary_color: team.primary_color.trim(),
  secondary_color: team.secondary_color.trim(),
  text_color: team.text_color.trim(),
  edited: team.edited
});

const sortTeams = (teams: TeamRecord[]): TeamRecord[] =>
  [...teams].sort((left, right) => compareEntityIds(left.id, right.id));
