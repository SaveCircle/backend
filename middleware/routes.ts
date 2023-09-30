import { RouteHandler } from "../types/routes.types.ts"

export const jsonResponseSender: RouteHandler = async (req, res, _next) => {
  const response = await req.response || {}
  res.status(response.status).json(response.body)
}
