// @deno-types="npm:@types/express"
import { Router } from "https://esm.sh/express@4.18.2"
import { routeTryCatcher } from "../utils/routes.utils.ts"
import { handlePostToUsers, handleGetByIdToUsers } from "../controllers/user.ts"
import { jsonResponseSender } from "../middleware/routes.ts"

const usersRouter = Router()

usersRouter.post("/", routeTryCatcher(handlePostToUsers), jsonResponseSender)
usersRouter.get(
  "/:id",
  routeTryCatcher(handleGetByIdToUsers),
  jsonResponseSender
)
export default usersRouter
