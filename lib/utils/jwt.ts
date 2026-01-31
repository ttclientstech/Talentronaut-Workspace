import jwt, { type Secret, type SignOptions } from "jsonwebtoken"

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error(
    "CRITICAL: JWT_SECRET environment variable is not set. " +
    "Please set JWT_SECRET in your .env file. " +
    "Generate a secure secret with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  )
}

const JWT_SECRET: string = process.env.JWT_SECRET
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d"

export interface JWTPayload {
  userId: string
  email: string
  role: "Admin" | "Lead" | "Member"
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET as Secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions)
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as Secret) as JWTPayload
    return decoded
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

/**
 * Decode token without verification (useful for expired tokens)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    console.error("JWT decode error:", error)
    return null
  }
}
