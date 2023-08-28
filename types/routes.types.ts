import { Request, Response, NextFunction } from "npm:express@4"

export type RouteHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => Promise<void> | void
