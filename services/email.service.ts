import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"
import env from "../deno.env.ts"

const { FROM_EMAIL, FROM_EMAIL_PWD, RECV_EMAIL } = env.toObject()

console.log(FROM_EMAIL, FROM_EMAIL_PWD, RECV_EMAIL)

const client = new SMTPClient({
  connection: {
    hostname: "smtp.gmail.com",
    port: 465,
    tls: true,
    auth: {
      username: FROM_EMAIL,
      password: FROM_EMAIL_PWD,
    },
  },
})

export const sendEmail = async (config: {
  subject: string
  content: string
  html: string
  to: string
}) => {
  try {
    await client.send({
      from: FROM_EMAIL,
      ...config,
    })
    await client.close()
    return {
      done: true,
    }
  } catch (err) {
    return {
      error: true,
      ...err,
    }
  }
}
