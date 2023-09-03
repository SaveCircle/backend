import client from "./connect.ts"
import env from "../deno.env.ts"

const db = client.database(`savecircle-${env.get("DENO_ENV") || "DEV"}`)

export default db
