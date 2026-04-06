import { NextResponse } from "next/server";

import { DataApiError, getTournamentBySlug } from "@/lib/api/data-api";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    if (!slug.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: "Route parameter 'slug' is required",
          },
        },
        { status: 400 },
      );
    }

    const response = await getTournamentBySlug(slug);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof DataApiError) {
      return toErrorResponse(error);
    }

    throw error;
  }
}
