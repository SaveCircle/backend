import { RouteHandler } from "../types/routes.types.ts"

export const routeTryCatcher: (arg0: RouteHandler) => RouteHandler =
  (asyncFn) => async (req, res, next) => {
    try {
      return await asyncFn(req, res, next)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

export const generateResponse = (
  body: {
    [x: string]: unknown
  },
  status: number
) => {
  return {
    body,
    status,
  }
}
