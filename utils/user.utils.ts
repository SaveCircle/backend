import User, {
  UserSchema,
  googleAccount,
  normalAccount,
} from "../models/user.ts"
import { RouteHandler } from "../types/routes.types.ts"
import { bcryptHash, bcryptCompare } from "./auth.utils.ts"
import { generateResponse } from "./routes.utils.ts"
import env from "../deno.env.ts"
import { createJWT, generateCryptoKey } from "../utils/auth.utils.ts"
import { sendEmail } from "../services/email.service.ts"
import { renderTemplate } from "../services/eta.service.ts"
import { ObjectId } from "https://deno.land/x/mongo@v0.32.0/deps.ts"
import jwtDecode from "npm:jwt-decode"
import { GoogleJwtPayload } from "../types/app.types.ts"

export async function generateJWTWithUserId(userId: string) {
  return await createJWT(
    { alg: "HS256", typ: "JWT" },
    {
      iat: Date.now(),
      exp: new Date().getTime() + 60 * 60 * 24 * 1000,
      _id: userId,
    },
    await generateCryptoKey(env.get("JWT_KEY") as string)
  )
}
export async function getUserByEmail(email: string) {
  return await User.findOne({ email })
}
export async function getUserById(_id: string) {
  return await User.findOne({ _id: new ObjectId(_id) })
}

export const sendUserVerificationEmail = async function (
  user: UserSchema,
  token: string
) {
  const emailTemplate = renderTemplate("./verify-email", {
    user,
    verificationLink: `<a style='color:white;' href='https://localhost:1990/api/v1/users/${user._id}?vrf-token=${token}' rel='noreferrer' target='_blank'>Verify Email</a>`,
  })
  return await sendEmail({
    subject: "Verify Your Email",
    to: user.email,
    content: emailTemplate,
    html: emailTemplate,
  })
}

export const generateEmailVerificationToken = function () {
  const token = crypto.randomUUID()
  return token
}

export const createNewUser = async (userData: {
  firstName: string
  lastName: string
  email: string
  password?: string
  emailVerificationToken?: string
  emailVerified: boolean
  accountType: normalAccount | googleAccount
  picture?: string
}) => {
  const {
    firstName,
    lastName,
    password,
    email,
    emailVerificationToken,
    emailVerified,
    accountType,
    picture,
  } = userData
  if (
    firstName &&
    lastName &&
    email &&
    ((accountType === "normal" && password) || accountType === "google")
  ) {
    const newUser = {
      firstName,
      lastName,
      email,
      password: password ? await bcryptHash(password) : undefined,
      emailVerified,
      emailVerificationToken,
      accountType,
      picture,
      createdAt: new Date(Date.now()),
      isDeleted: false,
      updatedAt: new Date(Date.now()),
    }
    return await User.insertOne(newUser)
  } else {
    throw new Error("Missing required fields!")
  }
}

export const signup: RouteHandler = async function (req, _res, next) {
  const emailVerificationToken = generateEmailVerificationToken()
  const newUserId = await createNewUser({
    ...req.body,
    emailVerificationToken,
    accountType: "normal",
    emailVerified: false,
  })
  await sendUserVerificationEmail(
    (await getUserById(newUserId.toString())) as UserSchema,
    emailVerificationToken
  )
  req.response = generateResponse({ _id: newUserId.toJSON() }, 201)
  return next()
}

export const login: RouteHandler = async function (req, _res, next) {
  const user = { ...req.user }
  const { email, password } = req.body
  const isMatchedPassword = await bcryptCompare(password, user.password)
  if (isMatchedPassword && email === email) {
    const jwt = await generateJWTWithUserId(user._id.toString())
    delete user.password
    req.response = generateResponse({ user, token: jwt }, 200)
    return next()
  } else {
    req.response = generateResponse({ message: "Invalid credentials" }, 400)
    return next()
  }
}

export function decodeGoogleJwt(token: string): GoogleJwtPayload {
  return jwtDecode.default(token)
}

const isNbfInvalid = (nbf: number) => Math.sign(Date.now() - nbf * 1000) === -1

export const decodedJwtIsValid = (decodedJwt: GoogleJwtPayload) => {
  const { aud, nbf, iss, exp, email_verified } = decodedJwt

  if (
    !aud ||
    aud !== env.get("GOOGLE_CLIENT_ID") ||
    !nbf ||
    !iss ||
    !exp ||
    !email_verified ||
    isNbfInvalid(nbf) ||
    Date.now() > exp * 1000 ||
    iss !== env.get("GOOGLE_ISS")
  )
    return false
  return true
}

export const signupWithGoogle: RouteHandler = async function (req, _res, next) {
  const { given_name, family_name, email_verified, picture, email } =
    req.decodedGoogleJwt
  const userData = {
    emailVerified: email_verified,
    firstName: given_name,
    lastName: family_name,
    picture,
    email,
    accountType: "google" as googleAccount,
    emailVerificationToken: undefined,
  }
  const newUserId = await createNewUser(userData)
  const jwt = await generateJWTWithUserId(newUserId.toString())
  req.response = generateResponse({ _id: newUserId.toJSON(), token: jwt }, 200)
  return next()
}

export const loginWithGoogle: RouteHandler = async function (req, _res, next) {
  const user = { ...req.user }
  if (!user.emailVerified) {
    const emailVerificationToken = generateEmailVerificationToken()
    await sendUserVerificationEmail(user, emailVerificationToken)
    await User.findAndModify(
      { _id: user._id, emailVerificationToken },
      {
        update: {
          ...user,
          emailVerified: true,
        },
      }
    )
    req.response = generateResponse(
      { message: "Please verify your email!" },
      201
    )
    return next()
  }
  const jwt = await generateJWTWithUserId(user._id.toString())
  req.response = generateResponse({ user, token: jwt }, 200)
  next()
}

export const verifyUser: RouteHandler = async (req, _res, next) => {
  const user = req.user
  const vrfToken = req.query["vrf-token"]
  if (user.emailVerified) {
    req.response = generateResponse({ message: "Action not allowed!" }, 400)
    next()
  } else if (vrfToken === user.emailVerificationToken) {
    delete user.emailVerificationToken
    await User.findAndModify(
      { _id: user._id, emailVerificationToken: vrfToken },
      {
        update: {
          ...user,
          emailVerified: true,
        },
      }
    )
    req.response = generateResponse(
      { message: "Email verified successfully!" },
      200
    )
    next()
  } else {
    req.response = generateResponse(
      {
        message:
          "Unable to verify email! Please request for a new verification email",
      },
      400
    )
    next()
  }
}
