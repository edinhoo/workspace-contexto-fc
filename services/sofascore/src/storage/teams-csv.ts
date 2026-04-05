import { slugify } from "@repo/utils";

import type { StadiumRecord, TeamRecord } from "../types.js";
import {
  compareEntityIds,
  createAuditFields,
  createEntityId,
  loadCsvRows,
  mergeAuditFields,
  normalizeAuditFields,
  saveCsvRows
} from "./shared/csv.js";

const CSV_HEADER =
  "id;slug;name;code3;short_name;complete_name;stadium;foundation;primary_color;secondary_color;text_color;source_ref;source;first_scraped_at;last_scraped_at;created_at;updated_at";
const SOURCE = "sofascore" as const;

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
      (existingTeam) =>
        (existingTeam.source_ref && existingTeam.source_ref === incomingTeam.source_ref) ||
        (existingTeam.slug === incomingTeam.slug && existingTeam.name === incomingTeam.name)
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
        (stadium) => stadium.id === team.stadium || stadium.source_ref === team.stadium
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
      team.source_ref,
      team.source,
      team.first_scraped_at,
      team.last_scraped_at,
      team.created_at,
      team.updated_at
    ].join(";")
  );

  await saveCsvRows(filePath, CSV_HEADER, rows);
};

const normalizeTeamRow = (header: string, row: string[]): TeamRecord => {

  if (
    header ===
    "id;slug;name;code3;short_name;complete_name;stadium;foundation;primary_color;secondary_color;text_color;edited"
  ) {
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
      text_color = ""
    ] = row;

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
      source_ref: "",
      source: SOURCE
    });
  }

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
    source_ref = "",
    legacyOrSource = SOURCE,
    tailA = "",
    tailB = "",
    tailC = "",
    tailD = ""
  ] = row;

  const isLegacyHeader =
    header ===
    "id;slug;name;code3;short_name;complete_name;stadium;foundation;primary_color;secondary_color;text_color;source_ref;edited";
  const source = legacyOrSource === SOURCE ? SOURCE : SOURCE;
  const audit = isLegacyHeader
    ? normalizeAuditFields({})
    : normalizeAuditFields({
        first_scraped_at: tailA,
        last_scraped_at: tailB,
        created_at: tailC,
        updated_at: tailD
      });

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
    source_ref,
    source,
    ...audit
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
    source_ref: team.source_ref,
    source: SOURCE,
    ...createAuditFields()
  });

const syncTeam = (existingTeam: TeamRecord, incomingTeam: TeamRecord): TeamRecord => {
  const nextTeam = {
    ...existingTeam,
    slug: pickIncomingValue(existingTeam.slug, incomingTeam.slug),
    name: pickIncomingValue(existingTeam.name, incomingTeam.name),
    code3: pickIncomingValue(existingTeam.code3, incomingTeam.code3),
    short_name: pickIncomingValue(existingTeam.short_name, incomingTeam.short_name),
    complete_name: pickIncomingValue(existingTeam.complete_name, incomingTeam.complete_name),
    stadium: pickIncomingValue(existingTeam.stadium, incomingTeam.stadium),
    foundation: pickIncomingValue(existingTeam.foundation, incomingTeam.foundation),
    primary_color: pickIncomingValue(existingTeam.primary_color, incomingTeam.primary_color),
    secondary_color: pickIncomingValue(
      existingTeam.secondary_color,
      incomingTeam.secondary_color
    ),
    text_color: pickIncomingValue(existingTeam.text_color, incomingTeam.text_color),
    source_ref: incomingTeam.source_ref,
    source: SOURCE
  };

  const changed = JSON.stringify(nextTeam) !== JSON.stringify({ ...existingTeam, source: SOURCE });

  return finalizeTeam({
    ...nextTeam,
    ...mergeAuditFields(existingTeam, changed)
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
  source_ref: team.source_ref.trim(),
  source: SOURCE,
  ...normalizeAuditFields(team)
});

const pickIncomingValue = (currentValue: string, incomingValue: string): string =>
  incomingValue.trim().length > 0 ? incomingValue : currentValue;

const sortTeams = (teams: TeamRecord[]): TeamRecord[] =>
  [...teams].sort((left, right) => compareEntityIds(left.id, right.id));
