import { z } from "zod";

import { paginationSchema } from "./common.js";

export const searchEntityTypeSchema = z.enum(["match", "team", "player"]);

export const searchQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1),
});

export const searchItemSchema = z.object({
  id: z.string(),
  type: searchEntityTypeSchema,
  label: z.string(),
  subtitle: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  items: z.array(searchItemSchema),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchItem = z.infer<typeof searchItemSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
