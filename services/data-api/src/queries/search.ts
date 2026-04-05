import { sql } from "kysely";

import type { SearchItem, SearchQuery } from "../contracts/search.js";
import type { DbClient } from "../types.js";

const createLikeTerm = (query: string): string => `%${query.toLowerCase()}%`;

export const searchEntities = async (
  db: DbClient,
  query: SearchQuery,
): Promise<SearchItem[]> => {
  const likeTerm = createLikeTerm(query.q);

  const [teams, players, matches] = await Promise.all([
    db
      .selectFrom("core.teams as t")
      .select([
        "t.id as id",
        sql<"team">`'team'`.as("type"),
        "t.name as label",
        sql<string | null>`coalesce(${sql.ref("t.short_name")}, ${sql.ref("t.code3")})`.as(
          "subtitle",
        ),
        "t.slug as slug",
      ])
      .where((eb) =>
        eb.or([
          eb(sql`lower(${sql.ref("t.name")})`, "like", likeTerm),
          eb(sql`lower(${sql.ref("t.slug")})`, "like", likeTerm),
        ]),
      )
      .limit(query.limit)
      .execute(),
    db
      .selectFrom("core.players as p")
      .innerJoin("core.countries as c", "c.id", "p.country")
      .select([
        "p.id as id",
        sql<"player">`'player'`.as("type"),
        "p.name as label",
        sql<string | null>`coalesce(${sql.ref("p.position")}, ${sql.ref("c.name")})`.as(
          "subtitle",
        ),
        "p.slug as slug",
      ])
      .where((eb) =>
        eb.or([
          eb(sql`lower(${sql.ref("p.name")})`, "like", likeTerm),
          eb(sql`lower(${sql.ref("p.slug")})`, "like", likeTerm),
        ]),
      )
      .limit(query.limit)
      .execute(),
    db
      .selectFrom("core.matches as m")
      .innerJoin("core.teams as ht", "ht.id", "m.home_team")
      .innerJoin("core.teams as at", "at.id", "m.away_team")
      .select([
        "m.id as id",
        sql<"match">`'match'`.as("type"),
        sql<string>`${sql.ref("ht.name")} || ' vs ' || ${sql.ref("at.name")}`.as(
          "label",
        ),
        sql<string | null>`to_char(${sql.ref("m.start_time")}, 'YYYY-MM-DD HH24:MI')`.as(
          "subtitle",
        ),
        sql<string | null>`null`.as("slug"),
      ])
      .where((eb) =>
        eb.or([
          eb(sql`lower(${sql.ref("ht.name")})`, "like", likeTerm),
          eb(sql`lower(${sql.ref("at.name")})`, "like", likeTerm),
          eb(sql`lower(${sql.ref("m.source_ref")})`, "like", likeTerm),
        ]),
      )
      .limit(query.limit)
      .execute(),
  ]);

  return [...teams, ...players, ...matches].slice(0, query.limit);
};
