import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts"
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
  const res = await client.send({
    from: FROM_EMAIL,
    ...config,
  })
  console.log(res)
  return await client.close()
}
