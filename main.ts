// @deno-types="npm:@types/express"
import express, {
  NextFunction,
  Request,
  Response,
} from "https://esm.sh/express@4.18.2"
import usersRouter from "./routes/users.ts"
import env from "./deno.env.ts"

const app = express()

const port: number = Number(env.get("APP_PORT")) || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const reqLogger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(
    `from ${req.hostname} requesting ${req.path} with a ${req.method} method`
  )
  next()
}
app.use(reqLogger)

app.use("/api/v1/users", usersRouter)

app.listen(port, () => {
  console.log("listening on port " + port)
})
