import { Bson } from "https://deno.land/x/mongo@v0.32.0/mod.ts"
import db from "../mongodb/db.ts"

export type googleAccount = "google"
export type normalAccount = "normal"

export type Cycle = "DAILY" | "WEEKLY" | "MONTHLY"
export const cycle = ["DAILY", "WEEKLY", "MONTHLY"]
export type esusuSchema = {
  _id: Bson.ObjectId
  creator: Bson.ObjectId
  members: Bson.ObjectId[]
  hasCollected: Bson.ObjectId[]
  hasContributed: { round: number; contributors: Bson.ObjectId[] }[]
  createdAt: Date
  isCompleted: boolean
  autoRepeat: boolean
  contributionAmount: number
  contributionFrequency: Cycle
  isLocked: boolean
  invitationKey: string
  invitees: Bson.ObjectId[]
  inviteeEmails: string[]
  name?: string
}

const esusus = db.collection<esusuSchema>("esusus")

export default esusus
