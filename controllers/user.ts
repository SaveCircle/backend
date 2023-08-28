import { RouteHandler } from "../types/routes.types.ts"

export const createNewUser: RouteHandler = (req, _res, next) => {
  req.response = {
    body: {
      hello: "world",
    },
    status: 300,
  }
  next()
}
