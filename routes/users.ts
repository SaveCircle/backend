// @deno-types="npm:@types/express"
import { Router } from "npm:express"
import { routeTryCatcher } from "../utils/routes.utils.ts"
import { createNewUser } from "../controllers/user.ts"
import { jsonResponseSender } from "../middleware/routes.ts"

const usersRouter = Router()

usersRouter.get("/", routeTryCatcher(createNewUser), jsonResponseSender)
export default usersRouter
