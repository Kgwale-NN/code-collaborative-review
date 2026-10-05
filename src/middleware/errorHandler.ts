import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  next
) => {
  // Express must finish handling errors if a response has already started.
  if (res.headersSent) {
    next(error);
    return;
  }

  const errorType =
    typeof error === "object" && error !== null && "type" in error
      ? error.type
      : undefined;

  if (errorType === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON in request body" });
    return;
  }

  if (errorType === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large" });
    return;
  }

  if (
    errorType === "encoding.unsupported" ||
    errorType === "charset.unsupported"
  ) {
    res.status(415).json({ message: "Unsupported request encoding" });
    return;
  }

  // Do not log request bodies, tokens, passwords, or database error details.
  console.error("Unhandled request error", {
    method: req.method,
    path: req.path,
    errorName: error instanceof Error ? error.name : "UnknownError"
  });

  res.status(500).json({
    message: "An unexpected server error occurred"
  });
};
