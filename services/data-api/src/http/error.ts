import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { errorResponseSchema } from "../contracts/common.js";

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): FastifyReply => {
  const payload = errorResponseSchema.parse({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });

  return reply.status(statusCode).send(payload);
};

export const registerErrorHandler = (
  app: FastifyRequest["server"],
): void => {
  app.setNotFoundHandler((_request, reply) => {
    void sendError(reply, 404, "route_not_found", "Route not found");
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      void sendError(
        reply,
        error.statusCode,
        error.code,
        error.message,
        error.details,
      );
      return;
    }

    if (error instanceof ZodError) {
      void sendError(reply, 400, "validation_error", "Invalid request", {
        issues: error.issues,
      });
      return;
    }

    void sendError(reply, 500, "internal_error", "Unexpected internal error");
  });
};
