import env from "../deno.env.ts"
import { NextFunction, Request, Response } from "https://esm.sh/express@4.18.2"
import { AppError } from "../types/app.types.ts";

const ErrorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const errStatus = err.statusCode || 500
  const errMsg = err.message || "Something went wrong"
  res.status(errStatus).json({
    status: errStatus,
    message: errMsg,
    stack: env.get("DENO_ENV") === "DEV" ? err.stack : {},
  })
}

export default ErrorHandler
