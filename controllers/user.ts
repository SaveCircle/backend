import { RouteHandler } from "../types/routes.types.ts"
import User from "../models/user.ts"

export const createNewUser: RouteHandler = (req, _res, next) => {
  console.log(User, "ajfsjjkfd")
  req.response = {
    body: {
      hello: "world",
    },
    status: 300,
  }
  next()
}
