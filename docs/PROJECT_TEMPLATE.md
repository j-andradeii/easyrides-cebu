# Project Template - Next.js Full-Stack Application

> A comprehensive template for building modern web applications with Next.js, React, TypeScript, and an event-driven architecture.

---

## Quick Start

```bash
# 1. Create new project
npx create-next-app@latest my-app --typescript --tailwind --eslint --app

# 2. Install dependencies
cd my-app
npm install zustand react-hook-form @hookform/resolvers zod primereact primeicons

# 3. Set up folder structure (see Section 2)

# 4. Copy configuration files

# 5. Start development
npm run dev
```

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Configuration Files](#3-configuration-files)
4. [Environment Variables](#4-environment-variables)
5. [Theming & Styling](#5-theming--styling)
6. [State Management](#6-state-management)
7. [Type System](#7-type-system)
8. [API Client](#8-api-client)
9. [Event System](#9-event-system)
10. [Form Components](#10-form-components)
11. [Authentication](#11-authentication)
12. [Component Patterns](#12-component-patterns)
13. [Utilities](#13-utilities)
14. [Checklist](#14-checklist)

---

## 1. Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^5.0.0",
    "zod": "^4.0.0",
    "primereact": "^10.0.0",
    "primeicons": "^7.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 2. Project Structure

```
my-app/
├── public/                     # Static assets
│   ├── images/
│   └── favicon.ico
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── [endpoint]/
│   │   │       └── route.ts
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (protected)/       # Protected route group
│   │   │   └── dashboard/
│   │   ├── [dynamic]/         # Dynamic routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── [feature]/        # Feature-specific
│   │
│   ├── stores/               # Zustand stores
│   │   ├── user.store.ts
│   │   ├── event.store.ts
│   │   ├── loading.store.ts
│   │   └── index.ts
│   │
│   ├── models/               # Types & validation
│   │   ├── user.types.ts
│   │   ├── api-event.ts
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   └── [entity].schema.ts
│   │   └── index.ts
│   │
│   ├── services/             # API layer
│   │   ├── api-client.ts
│   │   ├── auth.service.ts
│   │   ├── [entity].service.ts
│   │   └── index.ts
│   │
│   ├── core/                 # Core utilities
│   │   ├── config.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── index.ts
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useApiEvent.ts
│   │   └── index.ts
│   │
│   ├── guards/               # Route protection
│   │   └── AuthGuard.tsx
│   │
│   ├── layouts/              # Page layouts
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   │
│   ├── types/                # Global types
│   │   └── index.ts
│   │
│   ├── data/                 # Static data
│   │   └── [data].json
│   │
│   └── middleware.ts         # Next.js middleware
│
├── .env.local
├── .env.example
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── package.json
```

---

## 3. Configuration Files

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/services/*": ["./src/services/*"],
      "@/models/*": ["./src/models/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/core/*": ["./src/core/*"],
      "@/guards/*": ["./src/guards/*"],
      "@/layouts/*": ["./src/layouts/*"],
      "@/types/*": ["./src/types/*"],
      "@/data/*": ["./src/data/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // Docker-optimized
  // Add image domains if needed
  // images: {
  //   domains: ['example.com'],
  // },
};

export default nextConfig;
```

### postcss.config.mjs

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

### eslint.config.mjs

```javascript
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/', 'out/', 'build/', 'next-env.d.ts'],
  },
];

export default eslintConfig;
```

---

## 4. Environment Variables

### .env.example

```bash
# ===========================================
# APPLICATION
# ===========================================
NEXT_PUBLIC_APP_NAME="My App"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# API
# ===========================================
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY=15m
NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY=7d

# ===========================================
# FEATURE FLAGS
# ===========================================
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=false

# ===========================================
# EXTERNAL SERVICES (Optional)
# ===========================================
# Database
# DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Google Services
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Email
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=

# Storage
# S3_BUCKET=
# S3_REGION=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
```

### src/core/config.ts

```typescript
/**
 * Application Configuration
 *
 * Type-safe environment variable access with defaults
 */

// Helper functions
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

const getBoolEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

const getNumberEnvVar = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Configuration interface
export interface AppConfig {
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

// Export configuration
export const config: AppConfig = {
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'My App'),
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

// Validate required config (call in layout.tsx)
export const validateConfig = (): void => {
  const required = ['NEXT_PUBLIC_APP_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && config.features.debug) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};
```

---

## 5. Theming & Styling

### src/app/globals.css

```css
@import 'tailwindcss';

/* ===========================================
   CSS VARIABLES
   =========================================== */
:root {
  /* Brand Colors - Customize these */
  --color-primary: #3B82F6;
  --color-primary-light: #60A5FA;
  --color-primary-dark: #2563EB;

  --color-secondary: #10B981;
  --color-secondary-light: #34D399;
  --color-secondary-dark: #059669;

  --color-accent: #F59E0B;
  --color-accent-light: #FBBF24;
  --color-accent-dark: #D97706;

  /* Semantic Colors */
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Neutrals */
  --color-background: #FFFFFF;
  --color-foreground: #1A1A1A;
  --color-muted: #6B7280;
  --color-border: #E5E7EB;

  /* Typography */
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-inter), system-ui, sans-serif;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1A1A2E;
    --color-foreground: #F5F5F5;
    --color-muted: #9CA3AF;
    --color-border: #374151;
  }
}

/* ===========================================
   TAILWIND THEME (v4 inline)
   =========================================== */
@theme inline {
  --color-primary: var(--color-primary);
  --color-primary-light: var(--color-primary-light);
  --color-primary-dark: var(--color-primary-dark);

  --color-secondary: var(--color-secondary);
  --color-secondary-light: var(--color-secondary-light);
  --color-secondary-dark: var(--color-secondary-dark);

  --color-accent: var(--color-accent);
  --color-accent-light: var(--color-accent-light);
  --color-accent-dark: var(--color-accent-dark);

  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
  --color-info: var(--color-info);

  --color-background: var(--color-background);
  --color-foreground: var(--color-foreground);
  --color-muted: var(--color-muted);
  --color-border: var(--color-border);

  --font-sans: var(--font-sans);
  --font-display: var(--font-display);
}

/* ===========================================
   BASE STYLES
   =========================================== */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
  line-height: 1.6;
}

/* ===========================================
   PRIMEREACT OVERRIDES (Optional)
   =========================================== */
/* Calendar */
.p-calendar .p-inputtext {
  @apply w-full rounded-lg border border-gray-300 px-4 py-3;
}

.p-calendar .p-inputtext:focus {
  @apply border-primary ring-2 ring-primary/20;
}

/* Dropdown */
.p-dropdown {
  @apply w-full rounded-lg border border-gray-300;
}

.p-dropdown:not(.p-disabled):hover {
  @apply border-primary;
}

/* Button */
.p-button {
  @apply rounded-lg font-medium transition-all;
}

.p-button:focus {
  @apply ring-2 ring-primary/20;
}

/* Invalid State */
.p-invalid {
  @apply border-error;
}

/* ===========================================
   UTILITY CLASSES
   =========================================== */
.container-custom {
  @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
}

.section-padding {
  @apply py-12 md:py-16 lg:py-20;
}

.card {
  @apply rounded-2xl border border-border bg-white p-6 shadow-sm;
}

.input-base {
  @apply w-full rounded-lg border border-gray-300 px-4 py-3 transition-all;
  @apply focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20;
  @apply disabled:cursor-not-allowed disabled:bg-gray-100;
}

/* ===========================================
   ANIMATIONS
   =========================================== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

### src/app/layout.tsx

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App',
  },
  description: 'Your app description here',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
      </body>
    </html>
  );
}
```

---

## 6. State Management

### src/stores/user.store.ts

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface UserActions {
  setUser: (user: User, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
}

type UserStore = UserState & UserActions;

// Initial state
const initialState: UserState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

// Store
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (token, refreshToken) =>
        set({ token, refreshToken }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearUser: () => set(initialState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### src/stores/event.store.ts

```typescript
import { create } from 'zustand';
import { ApiEvent } from '@/models/api-event';

interface ApiEventStore {
  currentEvent: ApiEvent | null;
  subscribers: ((event: ApiEvent | null) => void)[];
  sendEvent: (event: ApiEvent) => void;
  subscribe: (callback: (event: ApiEvent | null) => void) => () => void;
  clearEvent: () => void;
}

export const useApiEventStore = create<ApiEventStore>((set, get) => ({
  currentEvent: null,
  subscribers: [],

  sendEvent: (event: ApiEvent) => {
    set({ currentEvent: event });
    // Notify all subscribers
    get().subscribers.forEach((callback) => callback(event));
  },

  subscribe: (callback: (event: ApiEvent | null) => void) => {
    set((state) => ({
      subscribers: [...state.subscribers, callback],
    }));

    // Return unsubscribe function
    return () => {
      set((state) => ({
        subscribers: state.subscribers.filter((cb) => cb !== callback),
      }));
    };
  },

  clearEvent: () => set({ currentEvent: null }),
}));
```

### src/stores/loading.store.ts

```typescript
import { create } from 'zustand';

interface LoadingState {
  activeRequests: number;
  isLoading: boolean;
}

interface LoadingActions {
  incrementRequests: () => void;
  decrementRequests: () => void;
  reset: () => void;
}

type LoadingStore = LoadingState & LoadingActions;

export const useLoadingStore = create<LoadingStore>((set) => ({
  activeRequests: 0,
  isLoading: false,

  incrementRequests: () =>
    set((state) => ({
      activeRequests: state.activeRequests + 1,
      isLoading: true,
    })),

  decrementRequests: () =>
    set((state) => {
      const newCount = Math.max(0, state.activeRequests - 1);
      return {
        activeRequests: newCount,
        isLoading: newCount > 0,
      };
    }),

  reset: () =>
    set({
      activeRequests: 0,
      isLoading: false,
    }),
}));
```

### src/stores/index.ts

```typescript
export { useUserStore } from './user.store';
export { useApiEventStore } from './event.store';
export { useLoadingStore } from './loading.store';
```

---

## 7. Type System

### src/models/api-event.ts

```typescript
/**
 * API Event System Types
 *
 * Used for tracking API request lifecycle and notifying components
 */

export enum ApiEventStatus {
  DEFAULT = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  ERROR = 3,
}

export enum ApiEventType {
  DEFAULT = 0,
  AUTHENTICATION = 1,
  // Add your event types here
  SUBMIT_FORM = 2,
  FETCH_DATA = 3,
  UPDATE_DATA = 4,
  DELETE_DATA = 5,
  REFRESH_TOKEN = 6,
}

export interface ApiEvent {
  type: ApiEventType;
  status: ApiEventStatus;
  title?: string;
  message?: string;
  spinner?: boolean;
  popup?: boolean;
  toast?: boolean;
  targetId?: string | number;
}

// Helper to create events
export const createApiEvent = (
  type: ApiEventType,
  status: ApiEventStatus,
  options?: Partial<Omit<ApiEvent, 'type' | 'status'>>
): ApiEvent => ({
  type,
  status,
  ...options,
});
```

### src/models/user.types.ts

```typescript
/**
 * User & Authentication Types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
```

### src/models/schemas/auth.schema.ts

```typescript
import { z } from 'zod';

/**
 * Authentication Validation Schemas
 */

// Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Profile Update
export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

### src/models/index.ts

```typescript
// Types
export * from './user.types';
export * from './api-event';

// Schemas
export * from './schemas/auth.schema';
```

---

## 8. API Client

### src/services/api-client.ts

```typescript
/**
 * API Client Service
 *
 * Fetch API wrapper with interceptors, token management, and error handling
 */

import { useLoadingStore } from '@/stores/loading.store';
import { useUserStore } from '@/stores/user.store';
import { config } from '@/core/config';

// --- Types ---

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  errors?: Record<string, string[]>;
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  skipAuth?: boolean;
  body?: unknown;
}

interface RetryConfig {
  endpoint: string;
  options?: FetchOptions;
}

// --- Store Actions ---

const { incrementRequests, decrementRequests } = useLoadingStore.getState();

// --- Request Interceptor ---

const buildHeaders = (options?: FetchOptions): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'en',
    ...(options?.headers as Record<string, string>),
  };

  // Add auth token if available and not skipped
  if (!options?.skipAuth) {
    const token = useUserStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

const buildUrl = (endpoint: string): string => {
  const baseUrl = config.app.url;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// --- Response Interceptor ---

const handleSuccessResponse = (response: Response): Response => {
  return response;
};

const handleErrorResponse = async (response: Response): Promise<ApiError> => {
  let errorData: unknown;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  const error: ApiError = {
    message:
      (errorData as { message?: string })?.message || 'An error occurred',
    status: response.status,
    statusText: response.statusText,
    errors: (errorData as { errors?: Record<string, string[]> })?.errors,
  };

  return error;
};

// --- Token Refresh ---

const refreshToken = async (): Promise<{
  token: string;
  refresh_token: string;
} | null> => {
  const userStore = useUserStore.getState();
  const currentRefreshToken = userStore.refreshToken;

  if (!currentRefreshToken) return null;

  try {
    const response = await fetch(buildUrl('api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.data;
  } catch {
    return null;
  }
};

const handleTokenRefresh = async (
  retryConfig: RetryConfig
): Promise<Response> => {
  const userStore = useUserStore.getState();
  const tokens = await refreshToken();

  if (!tokens?.token) {
    userStore.clearUser();
    throw {
      message: 'Session expired. Please login again.',
      status: 401,
    } as ApiError;
  }

  userStore.setTokens(tokens.token, tokens.refresh_token);

  return makeRequest(retryConfig.endpoint, {
    ...retryConfig.options,
    headers: {
      ...retryConfig.options?.headers,
      Authorization: `Bearer ${tokens.token}`,
    },
  });
};

// --- Core Request Function ---

const makeRequest = async (
  endpoint: string,
  options?: FetchOptions
): Promise<Response> => {
  incrementRequests();

  try {
    const url = buildUrl(endpoint);
    const headers = buildHeaders(options);
    const body = options?.body ? JSON.stringify(options.body) : undefined;

    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // Handle 401 with token refresh
    if (response.status === 401) {
      const clonedResponse = response.clone();
      let errorData: { message?: string } = {};

      try {
        errorData = await clonedResponse.json();
      } catch {
        // Ignore parse error
      }

      if (errorData.message === 'Expired JWT Token') {
        decrementRequests();
        return handleTokenRefresh({ endpoint, options });
      }

      // Clear user on other 401 errors
      useUserStore.getState().clearUser();
    }

    decrementRequests();

    if (!response.ok) {
      const error = await handleErrorResponse(response);
      throw error;
    }

    return handleSuccessResponse(response);
  } catch (error) {
    decrementRequests();
    throw error;
  }
};

// --- API Client Class ---

class ApiClient {
  async get(endpoint: string, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'POST', body });
  }

  async put(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint: string, options?: FetchOptions): Promise<Response> {
    return makeRequest(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton
export const apiClient = new ApiClient();
```

### src/services/[entity].service.ts (Template)

```typescript
/**
 * Entity Service Template
 *
 * Replace [Entity] with your entity name (e.g., User, Product, Order)
 */

import { apiClient } from '@/services/api-client';
import { useApiEventStore } from '@/stores/event.store';
import { ApiEventType, ApiEventStatus } from '@/models/api-event';

// Types
interface Entity {
  id: string;
  // Add entity fields
}

interface CreateEntityDto {
  // Add create fields
}

interface UpdateEntityDto {
  // Add update fields
}

// Service
class EntityService {
  private basePath = 'api/entities';
  private eventStore = useApiEventStore.getState();

  async getAll(): Promise<Entity[]> {
    const response = await apiClient.get(this.basePath);
    return response.json();
  }

  async getById(id: string): Promise<Entity> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.json();
  }

  async create(data: CreateEntityDto): Promise<Entity> {
    const eventType = ApiEventType.SUBMIT_FORM;

    try {
      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.IN_PROGRESS,
        spinner: true,
      });

      const response = await apiClient.post(this.basePath, data);
      const result = await response.json();

      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.COMPLETED,
      });

      return result;
    } catch (error) {
      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.ERROR,
        message: (error as Error).message,
      });
      throw error;
    }
  }

  async update(id: string, data: UpdateEntityDto): Promise<Entity> {
    const eventType = ApiEventType.UPDATE_DATA;

    try {
      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.IN_PROGRESS,
        targetId: id,
      });

      const response = await apiClient.patch(`${this.basePath}/${id}`, data);
      const result = await response.json();

      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.COMPLETED,
        targetId: id,
      });

      return result;
    } catch (error) {
      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.ERROR,
        targetId: id,
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const eventType = ApiEventType.DELETE_DATA;

    try {
      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.IN_PROGRESS,
        targetId: id,
      });

      await apiClient.delete(`${this.basePath}/${id}`);

      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.COMPLETED,
        targetId: id,
      });
    } catch (error) {
      this.eventStore.sendEvent({
        type: eventType,
        status: ApiEventStatus.ERROR,
        targetId: id,
      });
      throw error;
    }
  }
}

export const entityService = new EntityService();
```

---

## 9. Event System

### src/hooks/useApiEvent.ts

```typescript
import { useEffect, useCallback } from 'react';
import { useApiEventStore } from '@/stores/event.store';
import { ApiEvent, ApiEventStatus, ApiEventType } from '@/models/api-event';

type EventHandler = () => void;
type EventTypeHandlers = Partial<Record<ApiEventType, EventHandler>>;
type EventStatusHandlers = Partial<Record<ApiEventStatus, EventTypeHandlers>>;

/**
 * Custom hook for subscribing to API events
 *
 * @param handlers - Object mapping status -> type -> handler
 *
 * @example
 * useApiEvent({
 *   [ApiEventStatus.COMPLETED]: {
 *     [ApiEventType.SUBMIT_FORM]: () => {
 *       setIsSubmitting(false);
 *       showSuccessToast();
 *     },
 *   },
 *   [ApiEventStatus.ERROR]: {
 *     [ApiEventType.SUBMIT_FORM]: () => {
 *       setIsSubmitting(false);
 *       showErrorToast();
 *     },
 *   },
 * });
 */
export const useApiEvent = (handlers: EventStatusHandlers): void => {
  const subscribe = useApiEventStore((state) => state.subscribe);

  const handleEvent = useCallback(
    (event: ApiEvent | null) => {
      if (!event) return;

      const statusHandlers = handlers[event.status];
      if (!statusHandlers) return;

      const typeHandler = statusHandlers[event.type];
      if (typeHandler) {
        typeHandler();
      }
    },
    [handlers]
  );

  useEffect(() => {
    const unsubscribe = subscribe(handleEvent);
    return () => unsubscribe();
  }, [subscribe, handleEvent]);
};
```

### Usage in Components

```typescript
'use client';

import { useState } from 'react';
import { useApiEvent } from '@/hooks/useApiEvent';
import { ApiEventStatus, ApiEventType } from '@/models/api-event';

export function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Subscribe to API events
  useApiEvent({
    [ApiEventStatus.COMPLETED]: {
      [ApiEventType.SUBMIT_FORM]: () => {
        setIsSubmitting(false);
        setToast({ message: 'Success!', type: 'success' });
      },
    },
    [ApiEventStatus.ERROR]: {
      [ApiEventType.SUBMIT_FORM]: () => {
        setIsSubmitting(false);
        setToast({ message: 'Something went wrong', type: 'error' });
      },
    },
    [ApiEventStatus.IN_PROGRESS]: {
      [ApiEventType.SUBMIT_FORM]: () => {
        setIsSubmitting(true);
      },
    },
  });

  // ... rest of component
}
```

---

## 10. Form Components

### src/components/forms/FormInput.tsx

```typescript
'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';

interface FormInputProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormInput({
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
}: FormInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Handle nested errors (e.g., "user.email")
  const getError = (path: string) => {
    return path.split('.').reduce((obj: any, key) => obj?.[key], errors);
  };

  const error = getError(name);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputText
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
            className={`input-base ${error ? 'border-error' : ''}`}
          />
        )}
      />

      {error?.message && (
        <span className="text-sm text-error">{error.message as string}</span>
      )}
    </div>
  );
}
```

### src/components/forms/FormSelect.tsx

```typescript
'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';

interface Option {
  label: string;
  value: string | number;
}

interface FormSelectProps {
  name: string;
  label: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  filter?: boolean;
  className?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  filter = false,
  className = '',
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const getError = (path: string) => {
    return path.split('.').reduce((obj: any, key) => obj?.[key], errors);
  };

  const error = getError(name);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Dropdown
            id={name}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            filter={filter}
            {...field}
            className={`w-full ${error ? 'p-invalid' : ''}`}
          />
        )}
      />

      {error?.message && (
        <span className="text-sm text-error">{error.message as string}</span>
      )}
    </div>
  );
}
```

### src/components/forms/FormTextarea.tsx

```typescript
'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { InputTextarea } from 'primereact/inputtextarea';

interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormTextarea({
  name,
  label,
  placeholder,
  rows = 4,
  maxLength,
  required = false,
  disabled = false,
  className = '',
}: FormTextareaProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const getError = (path: string) => {
    return path.split('.').reduce((obj: any, key) => obj?.[key], errors);
  };

  const error = getError(name);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputTextarea
            id={name}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            {...field}
            className={`input-base resize-none ${error ? 'border-error' : ''}`}
          />
        )}
      />

      {error?.message && (
        <span className="text-sm text-error">{error.message as string}</span>
      )}
    </div>
  );
}
```

### src/components/forms/FormCalendar.tsx

```typescript
'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Calendar } from 'primereact/calendar';

interface FormCalendarProps {
  name: string;
  label: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  dateFormat?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormCalendar({
  name,
  label,
  placeholder = 'Select a date',
  minDate,
  maxDate,
  showTime = false,
  dateFormat = 'mm/dd/yy',
  required = false,
  disabled = false,
  className = '',
}: FormCalendarProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const getError = (path: string) => {
    return path.split('.').reduce((obj: any, key) => obj?.[key], errors);
  };

  const error = getError(name);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Calendar
            id={name}
            placeholder={placeholder}
            minDate={minDate}
            maxDate={maxDate}
            showTime={showTime}
            dateFormat={dateFormat}
            showIcon
            disabled={disabled}
            {...field}
            className={`w-full ${error ? 'p-invalid' : ''}`}
          />
        )}
      />

      {error?.message && (
        <span className="text-sm text-error">{error.message as string}</span>
      )}
    </div>
  );
}
```

### src/components/forms/index.ts

```typescript
export { FormInput } from './FormInput';
export { FormSelect } from './FormSelect';
export { FormTextarea } from './FormTextarea';
export { FormCalendar } from './FormCalendar';
```

---

## 11. Authentication

### src/middleware.ts

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes
const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
```

### src/guards/AuthGuard.tsx

```typescript
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/user.store';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated || !token) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )
    );
  }

  return <>{children}</>;
}
```

---

## 12. Component Patterns

### Toast Component

```typescript
// src/components/ui/Toast.tsx
'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

const typeStyles = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
  warning: 'bg-warning text-black',
  info: 'bg-info text-white',
};

const typeIcons = {
  success: 'pi pi-check-circle',
  error: 'pi pi-times-circle',
  warning: 'pi pi-exclamation-triangle',
  info: 'pi pi-info-circle',
};

export function Toast({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg animate-slide-up ${typeStyles[type]}`}
    >
      <i className={typeIcons[type]} />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70"
        aria-label="Close"
      >
        <i className="pi pi-times" />
      </button>
    </div>
  );
}
```

### Loading Spinner

```typescript
// src/components/ui/Spinner.tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-primary border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );
}
```

### Button Component

```typescript
// src/components/ui/Button.tsx
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-secondary text-white hover:bg-secondary-dark',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-primary hover:bg-primary/10',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all focus:outline-none focus:ring-2 focus:ring-primary/20
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
```

---

## 13. Utilities

### src/core/utils.ts

```typescript
/**
 * Utility Functions
 */

// Date formatting
export const formatDate = (
  date: Date | string,
  locale: string = 'en-US'
): string => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (
  date: Date | string,
  locale: string = 'en-US'
): string => {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// String utilities
export const truncate = (
  str: string,
  length: number,
  suffix: string = '...'
): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toTitleCase = (str: string): string => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
};

// Functional utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// ID generation
export const generateId = (prefix: string = ''): string => {
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${random}` : random;
};

// Type checking
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>
  );
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  return Object.keys(obj).reduce(
    (acc, key) => {
      if (!keys.includes(key as K)) {
        (acc as any)[key] = (obj as any)[key];
      }
      return acc;
    },
    {} as Omit<T, K>
  );
};

// Formatting
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatNumber = (
  num: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

// Math
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// URL utilities
export const buildQueryString = (params: Record<string, any>): string => {
  return new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
  ).toString();
};

// Storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue ?? null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch {
      return defaultValue ?? null;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
```

### src/core/constants.ts

```typescript
/**
 * Application Constants
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const STORAGE_KEYS = {
  USER: 'user-storage',
  THEME: 'theme-preference',
  LANGUAGE: 'language-preference',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 500,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
```

---

## 14. Checklist

### Project Setup

- [ ] Create Next.js project with TypeScript
- [ ] Install dependencies (zustand, react-hook-form, zod, primereact)
- [ ] Set up folder structure
- [ ] Configure TypeScript paths
- [ ] Set up environment variables
- [ ] Configure ESLint

### Core Infrastructure

- [ ] Create config.ts with environment helpers
- [ ] Create constants.ts
- [ ] Create utils.ts with helper functions
- [ ] Set up API client with interceptors
- [ ] Implement token refresh logic

### State Management

- [ ] Create user store with persistence
- [ ] Create API event store
- [ ] Create loading store
- [ ] Export stores from index.ts

### Type System

- [ ] Define user types
- [ ] Define API event types
- [ ] Create Zod validation schemas
- [ ] Export from index.ts

### Components

- [ ] Create form components (Input, Select, Textarea, Calendar)
- [ ] Create UI components (Button, Spinner, Toast)
- [ ] Create layout components

### Authentication

- [ ] Set up middleware for route protection
- [ ] Create AuthGuard component
- [ ] Create login/register pages
- [ ] Implement auth service

### Styling

- [ ] Configure Tailwind CSS
- [ ] Define color palette
- [ ] Set up typography
- [ ] Add PrimeReact theme overrides
- [ ] Create utility classes

### Testing (Optional)

- [ ] Set up Jest/Vitest
- [ ] Set up React Testing Library
- [ ] Write unit tests for utilities
- [ ] Write component tests
- [ ] Write integration tests

### Deployment

- [ ] Configure next.config.ts for production
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables for production
- [ ] Test production build locally

---

## License

This template is open source and available under the MIT License.

---

## Contributing

Feel free to customize this template for your specific needs. If you find improvements, consider sharing them back!
