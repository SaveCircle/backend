// @deno-types="npm:@types/express"
import { Router } from "https://esm.sh/express@4.18.2"
import { jsonResponseSender } from "../middleware/routes.ts"
import {
  authenticateUser,
  checkForAuthenticatedUser,
} from "../middleware/auth.ts"
import {
  createNewEsusu,
  joinEsusu,
  getSingleEsusu,
  getManyEsusus,
  inviteUserToEsusu,
} from "../controllers/esusu.ts"

const esusuRouter = Router()
esusuRouter.use(authenticateUser, checkForAuthenticatedUser)
esusuRouter.post("/", createNewEsusu, jsonResponseSender)
esusuRouter.get("/", getManyEsusus, jsonResponseSender)
esusuRouter.put("/:esusuId", joinEsusu, jsonResponseSender)
esusuRouter.get("/:esusuId", getSingleEsusu, jsonResponseSender)
esusuRouter.post("/:esusuId/invite", inviteUserToEsusu, jsonResponseSender)

export default esusuRouter
