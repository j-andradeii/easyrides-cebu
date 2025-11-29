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
function getEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * Get boolean environment variable
 */
function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Application configuration object
 */
export const config: AppConfig = {
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'EasyRides App'),
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  },
  api: {
    url: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:8000/api'),
    timeout: getNumberEnvVar('NEXT_PUBLIC_API_TIMEOUT', 30000),
  },
  auth: {
    accessTokenExpiry: getEnvVar('NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY', '15m'),
    refreshTokenExpiry: getEnvVar('NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY', '7d'),
  },
  features: {
    analytics: getBoolEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
    debug: getBoolEnvVar('NEXT_PUBLIC_ENABLE_DEBUG', false),
  },
};

/**
 * Validate required environment variables
 * Call this at application startup
 */
export function validateConfig(): void {
  const required = [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_API_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}
