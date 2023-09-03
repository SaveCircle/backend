import { RouteHandler } from "../types/routes.types.ts"
import {
  getUserByEmail,
  regularUserSignup,
  googleUserSignup,
  loginUser,
  generateEmailVerificationToken,
  sendUserVerificationEmail,
  getUserById,
  verifyUser,
  loginUserWithGoogle,
} from "../utils/user.utils.ts"
import env from "../deno.env.ts"
import { generateResponse } from "../utils/routes.utils.ts"

export const handlePostToUsers: RouteHandler = async (req, res, next) => {
  if (!req.body.email) {
    req.response = generateResponse({ message: "Not allowed" }, 401)
    next()
  }
  const user = await getUserByEmail(req.body.email)
  if (!user) {
    const { password } = req.body
    if (password !== undefined) {
      return regularUserSignup(req, res, next)
    } else {
      return googleUserSignup(req, res, next)
    }
  } else {
    const { firstName, lastName, clientId, nbf, iss, exp } = req.body
    if (!firstName || !lastName) {
      if (!user.emailVerified) {
        const vrfToken = generateEmailVerificationToken()
        await sendUserVerificationEmail(user, vrfToken)
        req.response = generateResponse({ email: "verify email" }, 200)
        next()
      } else {
        req.user = user
        if (req.body.password && user.accountType === "normal") {
          return loginUser(req, res, next)
        } else if (
          user.accountType === "google" &&
          clientId &&
          clientId === env.get("GOOGLE_CLIENT_ID") &&
          nbf &&
          iss &&
          exp &&
          Math.sign(Date.now() - nbf * 1000) === 1 &&
          Date.now() < exp * 1000 &&
          iss === env.get("GOOGLE_ISS")
        ) {
          return loginUserWithGoogle(req, res, next)
        } else {
          req.response = generateResponse(
            { message: "Invalid credentials" },
            400
          )
          next()
        }
      }
    } else {
      req.response = generateResponse(
        { message: "Email address is already in use" },
        400
      )
      next()
    }
  }
}

export const handleGetByIdToUsers: RouteHandler = async (req, res, next) => {
  const userId = req.params.id
  req.user = await getUserById(userId)
  if (!req.user) {
    req.response = generateResponse({ message: "User not found!" }, 404)
    next()
  }
  if (req.query["vrf-token"]) return await verifyUser(req, res, next)
  req.response = generateResponse({ user: req.user }, 200)
  next()
}
