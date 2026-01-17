/**
 * Application Configuration
 *
 * Centralized, type-safe access to environment variables
 * Validates required variables at runtime
 */

interface AppConfig {
  app: {
    name: string;
    url: string;
  };
  api: {
    url: string;
    timeout: number;
  };
  auth: {
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  features: {
    analytics: boolean;
    debug: boolean;
  };
}

/**
 * Get environment variable with fallback
 */
// Helper functions removed as direct access is required for Next.js inlining

/**
 * Application configuration object
 */
export const config: AppConfig = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'EasyRides App',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  },
  auth: {
    accessTokenExpiry: process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY || '7d',
  },
  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    debug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
  },
};

/**
 * Validate required environment variables
 * Call this at application startup
 */
export function validateConfig(): void {
  const missing: string[] = [];

  if (!config.app.name) missing.push('NEXT_PUBLIC_APP_NAME');
  if (!config.api.url) missing.push('NEXT_PUBLIC_API_URL');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}
