// @deno-types="npm:@types/express"
import express, { NextFunction, Request, Response } from "npm:express"
import usersRouter from "./routes/users.ts"
import env from "./deno.env.ts"
import { sendEmail } from "./services/email.service.ts"
const app = express()

const port: number = Number(env.get("APP_PORT")) || 3000

await sendEmail({
  subject: "example",
  content: "auto",
  html: "<p>Hello World</p>",
  to: "exploitenomah@gmail.com",
})

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
