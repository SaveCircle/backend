import { Request, Response, NextFunction } from "https://esm.sh/express@4.18.2"

export type RouteHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => Promise<void> | void
