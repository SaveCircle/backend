export type AppError = Error & { statusCode?: number }

export type GoogleJwtPayload = {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  nbf: number
  name: string
  picture: string
  given_name: string
  family_name: string
  locale: string
  iat: number
  exp: number
  jti: string
}
