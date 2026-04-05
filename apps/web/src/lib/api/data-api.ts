import type { ErrorResponse } from "@services/data-api/contracts/common";
import type { MatchResponse } from "@services/data-api/contracts/matches";
import type { SearchResponse } from "@services/data-api/contracts/search";

const defaultDataApiUrl = "http://127.0.0.1:3100";

const getDataApiUrl = (): string =>
  process.env.DATA_API_URL?.trim() || defaultDataApiUrl;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isErrorResponse = (value: unknown): value is ErrorResponse => {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
};

export class DataApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DataApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const parseDataApiError = async (
  response: Response,
): Promise<DataApiError> => {
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (isErrorResponse(payload)) {
    return new DataApiError(
      response.status,
      payload.error.code,
      payload.error.message,
      payload.error.details,
    );
  }

  return new DataApiError(
    response.status,
    "upstream_error",
    "Unexpected response from data-api",
  );
};

const fetchDataApi = async <T>(path: string): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${getDataApiUrl()}${path}`, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new DataApiError(502, "upstream_unavailable", "data-api unavailable", {
      cause: error instanceof Error ? error.message : "unknown_fetch_error",
    });
  }

  if (!response.ok) {
    throw await parseDataApiError(response);
  }

  return (await response.json()) as T;
};

export const searchEntities = async (
  query: string,
  limit?: number,
): Promise<SearchResponse> => {
  const params = new URLSearchParams({ q: query });

  if (typeof limit === "number") {
    params.set("limit", String(limit));
  }

  return fetchDataApi<SearchResponse>(`/search?${params.toString()}`);
};

export const getMatch = async (id: string): Promise<MatchResponse> =>
  fetchDataApi<MatchResponse>(`/matches/${id}`);
