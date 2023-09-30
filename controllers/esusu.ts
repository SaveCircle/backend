import { RouteHandler } from "../types/routes.types.ts"
import env from "../deno.env.ts"
import { generateResponse } from "../utils/routes.utils.ts"
import Esusu, { cycle } from "../models/esusu.ts"
import { Bson } from "https://deno.land/x/mongo@v0.32.0/mod.ts"
import { AppError } from "../types/app.types.ts"
import { routeTryCatcher } from "../utils/routes.utils.ts"

export const createNewEsusu: RouteHandler = routeTryCatcher(
  async (req, _res, next) => {
    const { contributionAmount, contributionFrequency } = req.body
    if (!contributionAmount || !contributionFrequency) {
      req.response = generateResponse(
        { message: "All fields are required" },
        401
      )
      return next()
    } else if (contributionAmount < 1000) {
      req.response = generateResponse(
        { message: "Minimum contribution amount is 1000" },
        401
      )
      return next()
    } else if (!cycle.includes(contributionFrequency)) {
      req.response = generateResponse(
        {
          message:
            "Invalid contribution frequency. Please use either 'DAILY', 'WEEKLY' or 'MONTHLY'",
        },
        401
      )
      return next()
    }
    const newEsusu = {
      creator: req.user._id,
      members: [new Bson.ObjectId(req.user._id)],
      hasCollected: [],
      hasContributed: [],
      createdAt: new Date(Date.now()),
      isCompleted: false,
      autoRepeat: false,
      isLocked: false,
      contributionAmount,
      contributionFrequency,
      invitationKey: crypto.randomUUID(),
      invitees: [],
    }
    const esusuId = await Esusu.insertOne(newEsusu)
    const esusu = await Esusu.findOne({ _id: esusuId })
    req.response = generateResponse({ esusu }, 201)
    next()
  }
)

export const joinEsusu: RouteHandler = routeTryCatcher(
  async (req, _res, next) => {
    const error: AppError = new Error("Operation not allowed!")
    error.statusCode = 403

    const { invitationKey } = req.body
    const { esusuId } = req.params
    if (!invitationKey || !esusuId) return next(error)

    const esusu = await Esusu.findOne({
      _id: new Bson.ObjectId(esusuId as string),
    })
    if (!esusu || esusu.invitationKey !== invitationKey) return next(error)
    const memberIdsAsStrings = esusu.members.map((el) => el.toString())
    if (memberIdsAsStrings.includes(req.user._id.toString())) {
      error.message = "Already a member"
      error.statusCode = 400
      return next(error)
    }
    const inviteesIdsAsStrings = esusu.invitees.map((el) => el.toString())
    if (!inviteesIdsAsStrings.includes(req.user._id.toString)) next(error)

    const updatedEsusu = await Esusu.findAndModify(
      { _id: new Bson.ObjectId(esusu._id) },
      {
        update: {
          ...esusu,
          members: [...esusu.members, new Bson.ObjectId(req.user._id)],
        },
      }
    )
    req.response = generateResponse({ esusu: updatedEsusu }, 201)
    next()
  }
)

export const getManyEsusus: RouteHandler = routeTryCatcher(
  async (req, _res, next) => {
    const error: AppError = new Error("Operation not allowed!")
    error.statusCode = 403
    const { limit, page } = req.query
    const esusus = await Esusu.find({
      $or: [
        {
          creator: new Bson.ObjectId(req.user._id),
        },
        {
          members: [new Bson.ObjectId(req.user._id)],
        },
        {
          invitees: [new Bson.ObjectId(req.user._id)],
        },
      ],
    })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({
        createdAt: -1,
      })
      .toArray()
    req.response = generateResponse({ esusus, totalCount: esusus.length }, 200)
    next()
  }
)

export const getSingleEsusu: RouteHandler = routeTryCatcher(
  async (req, _res, next) => {
    const error: AppError = new Error("Operation not allowed!")
    error.statusCode = 403

    const { esusuId } = req.params
    if (!esusuId) return next(error)

    const esusu = await Esusu.findOne({
      _id: new Bson.ObjectId(esusuId as string),
    })

    if (!esusu) {
      error.statusCode = 404
      error.message = "Cannot find resource"
      return next(error)
    }

    const memberIdsAsStrings = esusu.members.map((el) => el.toString())
    if (!memberIdsAsStrings.includes(req.user._id.toString()))
      return next(error)

    req.response = generateResponse({ esusu }, 201)
    next()
  }
)
