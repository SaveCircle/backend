import { RouteHandler } from "../types/routes.types.ts"
import { generateResponse } from "../utils/routes.utils.ts"
import Esusu, { cycle } from "../models/esusu.ts"
import User from "../models/user.ts"
import { Bson } from "https://deno.land/x/mongo@v0.32.0/mod.ts"
import { AppError } from "../types/app.types.ts"
import { routeTryCatcher } from "../utils/routes.utils.ts"
import { sendInvitationToJoinEsusu } from "../utils/esusu.utils.ts"

export const createNewEsusu: RouteHandler = routeTryCatcher(
  async (req, _res, next) => {
    const { contributionAmount, contributionFrequency, name } = req.body
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
      invitationKey: (new Date().getTime() + 60 * 60 * 24 * 1000).toString(),
      invitees: [],
      inviteeEmails: [],
      name,
    }
    const esusuId = await Esusu.insertOne(newEsusu)
    const esusu = await Esusu.findOne({ _id: esusuId })
    req.response = generateResponse({ esusu }, 201)
    next()
  }
)
export const inviteUserToEsusu: RouteHandler = routeTryCatcher(
  async (req, _res, next) => {
    const error: AppError = new Error("Resource not found!")
    const { esusuId } = req.params

    const esusu = await Esusu.findOne({
      _id: new Bson.ObjectId(esusuId as string),
    })
    if (!esusu) {
      error.statusCode = 404
      return next(error)
    }
    if (esusu.creator.toString() !== req.user._id.toString()) {
      error.statusCode = 403
      error.message = "Action not allowed!"
      return next(error)
    }
    const { invitee } = req.body
    error.statusCode = 400
    if (!invitee) {
      error.message = "Please provide invitee email"
      return next(error)
    }
    const userByEmail = await User.findOne({ email: invitee })
    if (userByEmail) {
      if (
        esusu.members
          .map((el) => el.toString())
          .includes(userByEmail._id.toString())
      ) {
        error.message = "Cannot send invite. Invitee already a member!"
        error.statusCode = 400
        return next(error)
      }
    }
    let invitationKey = esusu.invitationKey
    if (new Date(invitationKey) < new Date(Date.now())) {
      invitationKey = (new Date().getTime() + 60 * 60 * 24 * 1000).toString()
    }
    const emailPromise = await sendInvitationToJoinEsusu({
      inviter: `${req.user.firstName} ${req.user.lastName}`,
      esusuId,
      invitationKey,
      invitee,
      esusuName: esusu.name as string,
    })

    if (emailPromise?.done) {
      const updEsusu = await Esusu.findAndModify(
        { _id: new Bson.ObjectId(esusuId) },
        {
          update: {
            ...esusu,
            invitees: userByEmail
              ? [...esusu.invitees, userByEmail._id]
              : esusu.invitees,
            invitationKey,
            inviteeEmails: [
              ...(esusu.inviteeEmails || []).filter((el) => el !== invitee),
              invitee,
            ],
          },
          new: true,
        }
      )
      req.response = generateResponse(
        { message: "Invite sent successfully!", esusu: updEsusu },
        200
      )
    } else {
      req.response = generateResponse(
        { message: "Unable to send invite!" },
        500
      )
    }
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
    if (typeof esusu !== "object" || esusu.invitationKey !== invitationKey)
      return next(error)
    if (new Date(invitationKey) < new Date(Date.now())) {
      error.message = "Invitation expired. Please ask that it be resent to you."
      error.statusCode = 400
      return next(error)
    }
    const memberIdsAsStrings = esusu.members.map((el) => el.toString())
    if (memberIdsAsStrings.includes(req.user._id.toString())) {
      error.message = "Already a member"
      error.statusCode = 400
      return next(error)
    }
    const inviteesIdsAsStrings = esusu.invitees.map((el) => el.toString())
    if (
      !inviteesIdsAsStrings.includes(req.user._id.toString) &&
      !esusu.inviteeEmails.includes(req.user.email)
    )
      return next(error)

    const updatedEsusu = await Esusu.findAndModify(
      { _id: new Bson.ObjectId(esusu._id) },
      {
        update: {
          ...esusu,
          members: [...esusu.members, new Bson.ObjectId(req.user._id)],
          invitees: esusu.invitees
            .map((el) => el.toString())
            .filter((it) => it !== req.user._id.toString())
            .map((el) => new Bson.ObjectId(el)),
        },
        new: true,
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
