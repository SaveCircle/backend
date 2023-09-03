import {
  create,
  Payload,
  Header,
  verify,
} from "https://deno.land/x/djwt@v2.9.1/mod.ts"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

export async function generateCryptoKey(secret: string) {
  const encoder = new TextEncoder()
  const keyBuf = encoder.encode(secret)
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"]
  )
  return key
}

export async function createJWT(
  header: Header,
  payload: Payload,
  key: CryptoKey
): Promise<string> {
  return await create(header, payload, key)
}

export async function verifyJWT(jwt: string, key: CryptoKey) {
  return await verify(jwt, key)
}

export async function bcryptHash(val: string) {
  return await bcrypt.hash(val)
}

export async function bcryptCompare(plain: string, hash: string) {
  return await bcrypt.compare(plain, hash)
}
