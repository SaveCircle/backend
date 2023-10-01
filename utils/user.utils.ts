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

export async function createNewUserWithPassword({
  firstName,
  lastName,
  email,
  password,
  emailVerificationToken,
}: {
  firstName: string
  lastName: string
  email: string
  password: string
  emailVerificationToken: string
}) {
  const newUser = {
    firstName,
    lastName,
    email,
    password: await bcryptHash(password),
    emailVerified: false,
    emailVerificationToken,
    accountType: "normal" as normalAccount,
    createdAt: new Date(Date.now()),
    isDeleted: false,
    updatedAt: new Date(Date.now()),
  }
  return await User.insertOne(newUser)
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

export const regularUserSignup: RouteHandler = async function (
  req,
  _res,
  next
) {
  const { firstName, lastName, password, email } = req.body
  if (firstName && lastName && email && password) {
    const emailVerificationToken = generateEmailVerificationToken()
    const newUserId = await createNewUserWithPassword({
      firstName,
      lastName,
      email,
      password,
      emailVerificationToken,
    })
    await sendUserVerificationEmail(
      (await getUserById(newUserId.toString())) as UserSchema,
      emailVerificationToken
    )
    req.response = generateResponse({ _id: newUserId.toJSON() }, 201)
    next()
  } else if ((email || password) && !firstName && !lastName) {
    req.response = generateResponse({ message: "Invalid credentials" }, 400)
    next()
  }
  req.response = generateResponse({ message: "All fields are required" }, 400)
  next()
}

export const googleUserSignup: RouteHandler = async function (req, _res, next) {
  const {
    email,
    clientId,
    nbf,
    iss,
    exp,
    emailVerified,
    givenName,
    familyName,
    picture,
  } = req.body
  if (
    !clientId ||
    clientId !== env.get("GOOGLE_CLIENT_ID") ||
    !nbf ||
    !iss ||
    !exp ||
    emailVerified === undefined ||
    Math.sign(Date.now() - nbf * 1000) === -1 ||
    Date.now() > exp * 1000 ||
    iss !== env.get("GOOGLE_ISS")
  ) {
    req.response = generateResponse({ message: "Bad Bequest" }, 400)
    next()
  } else {
    const userData = {
      emailVerified,
      firstName: givenName,
      lastName: familyName,
      picture,
      email,
      accountType: "google" as googleAccount,
      createdAt: new Date(Date.now()),
      isDeleted: false,
      updatedAt: new Date(Date.now()),
    }
    const newUserId = await User.insertOne(userData)
    const jwt = await generateJWTWithUserId(newUserId.toString())
    req.response = generateResponse(
      { _id: newUserId.toJSON(), token: jwt },
      200
    )
    next()
  }
}

export const loginUser: RouteHandler = async function (req, _res, next) {
  const user = { ...req.user }
  const { email, password } = req.body
  const isMatchedPassword = await bcryptCompare(password, user.password)
  if (isMatchedPassword && email === email) {
    const jwt = await generateJWTWithUserId(user._id.toString())
    delete user.password
    req.response = generateResponse({ user, token: jwt }, 200)
    next()
  } else {
    req.response = generateResponse({ message: "Invalid credentials" }, 400)
    next()
  }
}

export const loginUserWithGoogle: RouteHandler = async function (
  req,
  _res,
  next
) {
  const user = { ...req.user }
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
