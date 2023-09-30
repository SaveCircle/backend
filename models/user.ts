import { Bson } from "https://deno.land/x/mongo@v0.32.0/mod.ts"
import db from "../mongodb/db.ts"

export type googleAccount = "google"
export type normalAccount = "normal"

export type UserSchema = {
  _id: Bson.ObjectId
  password?: string
  picture?: string
  emailVerified?: boolean
  firstName: string
  lastName: string
  email: string
  emailVerificationToken?: string
  passwordResetToken?: string
  accountType: googleAccount | normalAccount
  createdAt: Date
  isDeleted: boolean
  updatedAt: Date
}

const users = db.collection<UserSchema>("users")
users.createIndexes({
  indexes: [
    {
      key: {
        email: -1,
      },
      name: "email",
      unique: true,
    },
  ],
})
export default users
