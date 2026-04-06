import { NextResponse } from "next/server";

import { DataApiError, getSeason } from "@/lib/api/data-api";

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
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: "Route parameter 'id' is required",
          },
        },
        { status: 400 },
      );
    }

    const response = await getSeason(id);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof DataApiError) {
      return toErrorResponse(error);
    }

    throw error;
  }
}
