import { NextResponse } from "next/server";

import { DataApiError, searchEntities } from "@/lib/api/data-api";

const toErrorResponse = (error: DataApiError) =>
  NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    },
    { status: error.status },
  );

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 10;

    if (!q) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: "Query parameter 'q' is required",
          },
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: "Query parameter 'limit' must be an integer between 1 and 50",
          },
        },
        { status: 400 },
      );
    }

    const response = await searchEntities(q, limit);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof DataApiError) {
      return toErrorResponse(error);
    }

    throw error;
  }
}
