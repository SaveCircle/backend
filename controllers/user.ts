import { RouteHandler } from "../types/routes.types.ts"
import {
  getUserByEmail,
  signup,
  login,
  signupWithGoogle,
  loginWithGoogle,
  getUserById,
  decodeGoogleJwt,
  decodedJwtIsValid,
  verifyUser
} from "../utils/user.utils.ts"
import env from "../deno.env.ts"
import { generateResponse } from "../utils/routes.utils.ts"

export const handlePostToUsers: RouteHandler = async (req, res, next) => {
  if (!req.body.email && !req.body.googleJwt) {
    req.response = generateResponse({ message: "Not allowed" }, 401)
    next()
  }
  if (req.body.email) {
    const existingUser = await getUserByEmail(req.body.email)
    if (!existingUser) return signup(req, res, next)
    else {
      req.user = existingUser
      return login(req, res, next)
    }
  } else if (req.body.googleJwt) {
    const decoded = decodeGoogleJwt(req.body.googleJwt)
    const isDecodedValid = decodedJwtIsValid(decoded)
    if(!isDecodedValid){
      req.response = generateResponse(
        { message: "An error occured!" },
        400
      )
      return next()
    }
    const existingUser = await getUserByEmail(decoded.email)
    if (!existingUser) {
      req.decodedGoogleJwt = decoded
      return signupWithGoogle(req, res, next)
    } else {
      req.user = existingUser
      return loginWithGoogle(req, res, next)
    }
  } else {
    req.response = generateResponse(
      { message: "Email address is already in use" },
      400
    )
    return next()
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

/*

      const vrfToken = generateEmailVerificationToken()
      await sendUserVerificationEmail(user, vrfToken)
      req.response = generateResponse({ email: "verify email" }, 200)
      next()
*/
