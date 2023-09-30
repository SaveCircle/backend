import { RouteHandler } from "../types/routes.types.ts"
import { verifyJWT, generateCryptoKey } from "../utils/auth.utils.ts"
import env from "../deno.env.ts"
import User from "../models/user.ts"
import { Bson } from "https://deno.land/x/mongo@v0.32.0/mod.ts"
import { AppError } from "../types/app.types.ts";

export const authenticateUser: RouteHandler = async (req, _res, next) => {
  try {
    const error: AppError = new Error("")
    if (!req.headers.access_token) {
      error.message = "Not allowed!"
      error.statusCode = 403
      next(error)
    }
    const decoded = await verifyJWT(
      req.headers.access_token,
      await generateCryptoKey(env.get("JWT_KEY") as string)
    )
    const user = await User.findOne({
      _id: new Bson.ObjectId(decoded._id as string),
    })
    if (!user) {
      error.message = "Not allowed!"
      error.statusCode = 403
      next(error)
    }
    req.user = user
    next()
  } catch (err) {
    err.statusCode = 500
    err.message = "Something went wrong!"
    next(err)
  }
}

export const checkForAuthenticatedUser: RouteHandler = (req, _res, next) => {
  if (!req.user) {
    const error: AppError = new Error(
      "Unable to perform operation!"
    )
    error.statusCode = 401
    return next(error)
  }
  return next()
}
