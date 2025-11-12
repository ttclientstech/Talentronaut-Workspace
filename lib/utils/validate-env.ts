/**
 * Environment Variable Validation
 *
 * This file validates required environment variables on application startup.
 * If any required variables are missing, the application will fail fast with clear error messages.
 */

interface EnvConfig {
  MONGODB_URI: string
  JWT_SECRET: string
  JWT_EXPIRES_IN?: string
  GEMINI_API_KEY: string
  NODE_ENV?: string
  NEXT_PUBLIC_API_URL?: string
}

const REQUIRED_ENV_VARS: (keyof EnvConfig)[] = [
  "MONGODB_URI",
  "JWT_SECRET",
  "GEMINI_API_KEY",
]

const OPTIONAL_ENV_VARS: (keyof EnvConfig)[] = [
  "JWT_EXPIRES_IN",
  "NODE_ENV",
  "NEXT_PUBLIC_API_URL",
]

export function validateEnvironmentVariables(): void {
  const missingVars: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // Check optional but recommended variables
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName)
    }
  }

  // If critical variables are missing, throw error and stop application
  if (missingVars.length > 0) {
    const errorMessage = `
╔═══════════════════════════════════════════════════════════════╗
║                  CONFIGURATION ERROR                          ║
╚═══════════════════════════════════════════════════════════════╝

❌ Missing required environment variables:
${missingVars.map((v) => `   - ${v}`).join("\n")}

📝 To fix this:
   1. Copy .env.example to .env.local
   2. Fill in the required values:

${missingVars
  .map((v) => {
    switch (v) {
      case "MONGODB_URI":
        return `      ${v}=mongodb://localhost:27017/your-database
      # or for MongoDB Atlas:
      ${v}=mongodb+srv://username:password@cluster.mongodb.net/database`
      case "JWT_SECRET":
        return `      ${v}=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">"`
      case "GEMINI_API_KEY":
        return `      ${v}=<get from https://makersuite.google.com/app/apikey>`
      default:
        return `      ${v}=<your-value-here>`
    }
  })
  .join("\n\n")}

   3. Restart the application

📚 See .env.example for complete configuration guide.
`

    throw new Error(errorMessage)
  }

  // Log warnings for optional variables
  if (warnings.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn("⚠️  Optional environment variables not set:")
    warnings.forEach((v) => {
      console.warn(`   - ${v} (using default)`)
    })
    console.warn("")
  }

  // Validate specific formats
  validateMongoDBURI()
  validateJWTSecret()
  validateGeminiAPIKey()

  // Success message
  if (process.env.NODE_ENV !== "production") {
    console.log("✅ All required environment variables validated successfully")
    console.log("")
  }
}

function validateMongoDBURI(): void {
  const uri = process.env.MONGODB_URI!

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error(
      `Invalid MONGODB_URI format. Must start with "mongodb://" or "mongodb+srv://". Got: ${uri.substring(0, 20)}...`
    )
  }
}

function validateJWTSecret(): void {
  const secret = process.env.JWT_SECRET!

  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET is too short (${secret.length} characters). ` +
      `For security, use at least 32 characters. ` +
      `Generate a secure secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    )
  }

  // Skip weak secret checks in CI environments (for build testing)
  // CI environment is detected by common CI environment variables
  const isCI = process.env.CI === 'true' ||
               process.env.GITHUB_ACTIONS === 'true' ||
               process.env.CONTINUOUS_INTEGRATION === 'true'

  if (isCI) {
    // In CI, just check length - allow test secrets
    return
  }

  // Check for common weak secrets in non-CI environments
  const weakSecrets = [
    "secret",
    "your-secret",
    "jwt-secret",
    "change-this",
    "your-super-secret",
    "password",
    "12345",
  ]

  const lowerSecret = secret.toLowerCase()
  for (const weak of weakSecrets) {
    if (lowerSecret.includes(weak)) {
      throw new Error(
        `JWT_SECRET appears to be a weak or placeholder value. ` +
        `Please generate a strong random secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      )
    }
  }
}

function validateGeminiAPIKey(): void {
  const apiKey = process.env.GEMINI_API_KEY!

  if (apiKey.length < 20) {
    throw new Error(
      `GEMINI_API_KEY appears to be invalid (too short). ` +
      `Get your API key from: https://makersuite.google.com/app/apikey`
    )
  }

  if (apiKey.includes("your-api-key") || apiKey.includes("placeholder")) {
    throw new Error(
      `GEMINI_API_KEY appears to be a placeholder value. ` +
      `Get your actual API key from: https://makersuite.google.com/app/apikey`
    )
  }
}

// Type-safe environment variable getter
export function getEnv(key: keyof EnvConfig): string {
  const value = process.env[key]
  if (!value && REQUIRED_ENV_VARS.includes(key)) {
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return value || ""
}

// Export validated environment configuration
export function getValidatedEnv(): EnvConfig {
  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
}
