# EasyRides App - Comprehensive Project Analysis

## Overview

EasyRides is a modern car rental and tour booking application for Cebu, Philippines. Built with Next.js 16, React 19, and TypeScript, it features a sophisticated event-driven architecture, type-safe forms with Zod validation, and a custom API client with automatic token refresh.

---

## Table of Contents

1. [Tech Stack & Dependencies](#1-tech-stack--dependencies)
2. [Project Structure](#2-project-structure)
3. [Configuration](#3-configuration)
4. [Theming & Styling](#4-theming--styling)
5. [Components Architecture](#5-components-architecture)
6. [Pages & Routing](#6-pages--routing)
7. [State Management (Zustand)](#7-state-management-zustand)
8. [Type System & Validation](#8-type-system--validation)
9. [API Communication Layer](#9-api-communication-layer)
10. [Event Handling System](#10-event-handling-system)
11. [Form Components](#11-form-components)
12. [Guards & Middleware](#12-guards--middleware)
13. [Static Data](#13-static-data)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Key Patterns](#15-key-patterns)
16. [Critical Files Reference](#16-critical-files-reference)

---

## 1. Tech Stack & Dependencies

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | React framework with App Router |
| React | 19.2.1 | UI library |
| TypeScript | 5 | Type-safe JavaScript |
| Node.js | - | Runtime environment |

### State & Forms

| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 5.0.8 | Lightweight state management |
| React Hook Form | 7.67.0 | Performant form handling |
| Zod | 4.1.13 | Schema validation |
| @hookform/resolvers | 5.2.2 | Form validation integration |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4 | Utility-first CSS framework |
| PrimeReact | 10.8.0 | Enterprise UI components |
| PrimeIcons | 7.0.0 | Icon library |

### External Services

| Technology | Version | Purpose |
|------------|---------|---------|
| Googleapis | 166.0.0 | Google Sheets API for form submissions |

### Dev Dependencies

- ESLint 9 with Next.js config
- TypeScript compiler
- PostCSS with Tailwind plugin

---

## 2. Project Structure

```
easyrides-app/
├── public/                     # Static assets
│   ├── logo.jpg               # Brand logo (favicon, OpenGraph)
│   └── images/
│       └── tours/             # Tour promotional images (13 PNGs)
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/
│   │   │   └── submit-booking/  # Booking API endpoint
│   │   ├── auth-module/       # Authentication pages
│   │   ├── dashboard/         # Admin dashboard
│   │   ├── tours/
│   │   │   ├── page.tsx       # Tours listing
│   │   │   └── [slug]/        # Dynamic tour detail pages
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles & theme
│   │
│   ├── components/            # Reusable UI components
│   │   ├── landing/           # Landing page sections (9 components)
│   │   ├── tours/             # Tour components
│   │   ├── Form*.tsx          # Form input components (7 files)
│   │   └── FacebookMessenger.tsx
│   │
│   ├── stores/                # Zustand state management
│   │   ├── user.store.ts      # Auth state (localStorage)
│   │   ├── event.store.ts     # API event pub/sub
│   │   ├── loading-bar.store.ts # Request tracking
│   │   └── resettable.store.ts  # Filter state pattern
│   │
│   ├── models/                # TypeScript types & Zod schemas
│   │   ├── api-event.ts       # API event types
│   │   ├── booking.schema.ts  # Booking validation
│   │   ├── user.types.ts      # User interfaces
│   │   └── validation-schemas.ts # Common schemas
│   │
│   ├── services/              # API layer
│   │   ├── api-client.ts      # Fetch wrapper with interceptors
│   │   └── query.service.ts   # Booking submission
│   │
│   ├── core/                  # Configuration & utilities
│   │   ├── config.ts          # Environment config
│   │   ├── constants.ts       # App constants
│   │   ├── form-messages.ts   # Validation messages
│   │   └── utils.ts           # Helper functions
│   │
│   ├── layouts/               # Page layouts
│   │   ├── MainLayout.tsx     # App layout
│   │   └── AuthLayout.tsx     # Auth pages layout
│   │
│   ├── guards/                # Route protection
│   │   └── AuthGuard.tsx      # Client-side auth guard
│   │
│   ├── hooks/                 # Custom React hooks (empty)
│   │
│   ├── types/                 # Additional types
│   │   └── tour.ts            # Tour data types
│   │
│   ├── data/                  # Static data
│   │   └── tours.json         # 16 tour packages
│   │
│   └── middleware.ts          # Server-side route protection
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── .env.local                 # Environment variables
```

---

## 3. Configuration

### 3.1 Environment Variables

**File:** `.env.local`

```bash
# Application
NEXT_PUBLIC_APP_NAME=EasyRides App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY=15m
NEXT_PUBLIC_REFRESH_TOKEN_EXPIRY=7d

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=false

# Google Sheets Integration
GOOGLE_SHEETS_CLIENT_EMAIL=<service-account-email>
GOOGLE_SHEETS_PRIVATE_KEY=<service-account-key>
GOOGLE_SPREADSHEET_ID=<spreadsheet-id>

# Social Media
NEXT_PUBLIC_FACEBOOK_PAGE_ID=<page-id>
```

### 3.2 App Configuration

**File:** `src/core/config.ts`

```typescript
interface AppConfig {
  app: {
    name: string;       // NEXT_PUBLIC_APP_NAME
    url: string;        // NEXT_PUBLIC_APP_URL (base for API)
  };
  api: {
    url: string;        // NEXT_PUBLIC_API_URL
    timeout: number;    // NEXT_PUBLIC_API_TIMEOUT (default: 30000)
  };
  auth: {
    accessTokenExpiry: string;   // Default: '15m'
    refreshTokenExpiry: string;  // Default: '7d'
  };
  features: {
    analytics: boolean;  // Feature flag
    debug: boolean;      // Debug mode
  };
}
```

### 3.3 TypeScript Configuration

**File:** `tsconfig.json`

- **Target:** ES2017
- **Strict Mode:** Enabled
- **Module Resolution:** Bundler (Next.js optimized)
- **Path Aliases:**
  - `@/*` → `./src/*`
  - `@/components/*`, `@/stores/*`, `@/services/*`, etc.

### 3.4 Next.js Configuration

**File:** `next.config.ts`

```typescript
{
  output: "standalone"  // Docker-optimized builds
}
```

---

## 4. Theming & Styling

### 4.1 Color Palette (Tropical Cebu-Inspired)

**File:** `src/app/globals.css`

| Color | Value | Usage |
|-------|-------|-------|
| **Cebu Red** | `#DC2626` | Brand primary, CTAs |
| **Sunset Orange** | `#F59E0B` | Accent |
| **Sunset Yellow** | `#FFC107` | Highlights |
| **Palm Green** | `#2D6A4F` | Nature, success |
| **Papaya** | `#FFAB76` | Warm accent |
| **Terracotta** | `#E07A5F` | Earth tones |
| **Hibiscus** | `#C94C4C` | Tropical red |
| **Cream** | `#F5F0E1` | Background |
| **Palm Black** | `#1A1A1A` | Text |

### 4.2 Typography

| Font | Usage | Weights |
|------|-------|---------|
| **Poppins** | Body text | 300, 400, 500, 600, 700 |
| **DM Sans** | Headings/Display | 400, 500, 600, 700 |

### 4.3 PrimeReact Theme

- Base: `lara-light-blue`
- Custom overrides for Calendar, Dropdown, Button components
- Invalid/disabled state styling

---

## 5. Components Architecture

### 5.1 Landing Page Components

**Location:** `src/components/landing/`

| Component | Purpose |
|-----------|---------|
| **Navigation** | Fixed header with nav links, mobile menu, CTAs |
| **HeroSection** | Hero with quick booking form, animated blobs |
| **ServicesSection** | 5 service cards in grid |
| **FleetSection** | 3 vehicle cards (Sedan, SUV, Van) with pricing |
| **DriverBanner** | Driver service promotion |
| **ToursSection** | Featured tours grid |
| **TransferRatesSection** | Airport transfer pricing table |
| **WhyChooseUs** | Value proposition cards |
| **ContactSection** | Contact form + info sidebar |
| **Footer** | 4-column footer with links |

### 5.2 Tour Components

**Location:** `src/components/tours/`

| Component | Purpose |
|-----------|---------|
| **TourCard** | Tour display card with image, pricing, CTA |
| **TourInquiryForm** | Tour-specific inquiry form |

### 5.3 Form Components

**Location:** `src/components/`

| Component | Purpose | Features |
|-----------|---------|----------|
| **FormInput** | Text/email/password | Phone/CC formatting, paste handling |
| **FormSelect** | Dropdown | PrimeReact Dropdown, filtering |
| **FormTextarea** | Multi-line text | Max length, row count |
| **FormCalendar** | Date picker | Min/max dates, time picker |
| **FormCheckbox** | Boolean input | Label + description |
| **FormPhoneInput** | Phone with country code | 20+ country codes |
| **FormError** | Error display | Red text styling |

---

## 6. Pages & Routing

### 6.1 Public Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page with all sections |
| `/tours` | `app/tours/page.tsx` | Tours listing grid |
| `/tours/[slug]` | `app/tours/[slug]/page.tsx` | Tour detail (SSG) |

### 6.2 Protected Pages

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `app/dashboard/page.tsx` | Admin dashboard |
| `/auth-module` | `app/auth-module/page.tsx` | Auth pages |

### 6.3 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/submit-booking` | POST | Handle booking form submissions |

### 6.4 Static Generation

Tours use `generateStaticParams()` for SSG:

```typescript
export async function generateStaticParams() {
  return toursData.tours.map((tour) => ({
    slug: tour.slug,
  }));
}
```

---

## 7. State Management (Zustand)

### 7.1 User Store

**File:** `src/stores/user.store.ts`

```typescript
interface UserState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// Actions
setUser(user, token, refreshToken)  // Login
setTokens(token, refreshToken)      // Token refresh
clearUser()                         // Logout
updateUser(updates)                 // Profile update
```

**Features:**
- localStorage persistence via `persist` middleware
- Storage key: `user-storage`

### 7.2 Event Store

**File:** `src/stores/event.store.ts`

```typescript
interface ApiEventStore {
  currentEvent: ApiEvent | null;
  subscribers: ((event: ApiEvent | null) => void)[];

  sendEvent(event: ApiEvent): void;
  subscribe(callback): () => void;  // Returns unsubscribe
}
```

**Features:**
- Custom pub/sub pattern
- Synchronous event broadcasting
- Cleanup via unsubscribe function

### 7.3 Loading Bar Store

**File:** `src/stores/loading-bar.store.ts`

```typescript
interface LoadingBarState {
  activeRequests: number;
  isLoading: boolean;

  incrementRequests(): void;
  decrementRequests(): void;
  reset(): void;
}
```

**Features:**
- Tracks concurrent API requests
- `isLoading = activeRequests > 0`

### 7.4 Resettable Store (Pattern Example)

**File:** `src/stores/resettable.store.ts`

```typescript
interface ResettableState {
  filters: { search, category, status };
  sortBy: string;
  page: number;

  setFilters(filters): void;
  setSortBy(sortBy): void;
  setPage(page): void;
  reset(): void;  // Reset to initial state
}
```

---

## 8. Type System & Validation

### 8.1 User Types

**File:** `src/models/user.types.ts`

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  bio?: string;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

### 8.2 Tour Types

**File:** `src/types/tour.ts`

```typescript
interface Tour {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  duration: string;
  featured: boolean;
  pricing: {
    sedan: { price: number; capacity: string };
    suv: { price: number; capacity: string };
    van: { price: number; capacity: string };
  };
  itinerary: { time?: string; activity: string }[];
  inclusions: string[];
  exclusions: string[];
}
```

### 8.3 API Event Types

**File:** `src/models/api-event.ts`

```typescript
enum ApiEventStatus {
  DEFAULT,      // Initial state
  IN_PROGRESS,  // Request pending
  COMPLETED,    // Success
  ERROR         // Failed
}

enum ApiEventType {
  DEFAULT,
  AUTHENTICATION,
  SUBMIT_QUERY,
  REFRESH_TOKEN
}

interface ApiEvent {
  type: ApiEventType;
  status: ApiEventStatus;
  title?: string;
  message?: string;
  spinner?: boolean;
  popup?: boolean;
  toast?: boolean;
  targetId?: string | number;
}
```

### 8.4 Validation Schemas (Zod)

**File:** `src/models/validation-schemas.ts`

```typescript
// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Registration
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)  // Uppercase
    .regex(/[a-z]/)  // Lowercase
    .regex(/[0-9]/), // Number
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword);

// Profile
const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  bio: z.string().max(500).optional(),
});
```

**File:** `src/models/booking.schema.ts`

```typescript
// Quick Booking (Hero)
const quickBookingSchema = z.object({
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour']),
  vehicleType: z.enum(['sedan', 'suv', 'van']).optional(),
  preferredDate: z.string().min(1),
  phone: z.string().min(10),
});

// Contact Form
const contactFormSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour', 'custom']),
  preferredDate: z.string().optional(),
  message: z.string().max(1000).optional(),
});
```

---

## 9. API Communication Layer

### 9.1 API Client Architecture

**File:** `src/services/api-client.ts`

The API client implements an **Axios-like interceptor pattern** using native Fetch API.

#### Type Definitions

```typescript
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  errors?: Record<string, string[]>;  // Validation errors
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  skipAuth?: boolean;
  body?: unknown;
}
```

#### Request Interceptor

```typescript
const buildUrl = (endpoint: string): string => {
  const baseUrl = config.app.url;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

const buildHeaders = (options?: FetchOptions): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Accept-Language': 'en',
  ...(options?.headers as Record<string, string>),
});
```

#### Response Interceptor

```typescript
const handleErrorResponse = async (response: Response): Promise<ApiError> => {
  let errorData: unknown;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  return {
    message: (errorData as { message?: string })?.message || 'An error occurred',
    status: response.status,
    statusText: response.statusText,
    errors: (errorData as { errors?: Record<string, string[]> })?.errors,
  };
};
```

#### Token Refresh Mechanism

```typescript
const handleTokenRefresh = async (retryConfig: RetryConfig): Promise<Response> => {
  const userStore = useUserStore.getState();
  const tokens = await refreshToken();  // POST /token/refresh

  if (!tokens?.token) {
    userStore.clearUser();
    throw { message: 'Session expired. Please login again.', status: 401 };
  }

  userStore.setTokens(tokens.token, tokens.refresh_token);
  return makeRequest(retryConfig.endpoint, {
    ...retryConfig.options,
    headers: { Authorization: `Bearer ${tokens.token}` },
  });
};
```

#### Core Request Function

```typescript
const makeRequest = async (endpoint: string, options?: FetchOptions): Promise<Response> => {
  incrementRequests();  // Loading bar

  try {
    const response = await fetch(url, { ...options, headers, body });

    if (response.status === 401) {
      const errorData = await response.clone().json();
      if (errorData.message === 'Expired JWT Token') {
        decrementRequests();
        return handleTokenRefresh({ endpoint, options });
      }
      useUserStore.getState().clearUser();
    }

    decrementRequests();

    if (!response.ok) {
      throw await handleErrorResponse(response);
    }

    return response;
  } catch (error) {
    decrementRequests();
    throw error;
  }
};
```

#### API Client Class

```typescript
class ApiClient {
  async get(endpoint, options?): Promise<Response>;
  async post(endpoint, body?, options?): Promise<Response>;
  async put(endpoint, body?, options?): Promise<Response>;
  async patch(endpoint, body?, options?): Promise<Response>;
  async delete(endpoint, options?): Promise<Response>;
}

export const apiClient = new ApiClient();
```

---

## 10. Event Handling System

### 10.1 Service Layer Pattern

**File:** `src/services/query.service.ts`

```typescript
export const submitQuery = async (data: any) => {
  const eventType = ApiEventType.SUBMIT_QUERY;
  const apiEventStore = useApiEventStore.getState();

  try {
    // 1. Emit IN_PROGRESS
    apiEventStore.sendEvent({
      type: eventType,
      status: ApiEventStatus.IN_PROGRESS,
      spinner: true
    });

    // 2. API Call
    await apiClient.post('/api/submit-booking', data);

    // 3. Emit COMPLETED
    apiEventStore.sendEvent({
      type: eventType,
      status: ApiEventStatus.COMPLETED,
      spinner: true
    });
  } catch (error) {
    console.log(error);
    // Should emit ERROR event
  }
};
```

### 10.2 Component Subscription Pattern

#### Subscription Setup

```typescript
useEffect(() => {
  const cleanup = getApiEvents();
  return () => cleanup();  // Unsubscribe on unmount
}, []);

const getApiEvents = () => {
  const unsubscribe = apiEventStore.subscribe((event) => {
    if (!event) return;
    const eventStatusHandleMap = createEventStatusHandleMap(event);
    const handleEvent = eventStatusHandleMap[event.status] || (() => {});
    handleEvent();
  });
  return () => unsubscribe();
};
```

#### Two-Level Factory Pattern

```typescript
const createEventStatusHandleMap = (apiEvent: ApiEvent) => ({
  // LEVEL 1: Status Handlers
  [ApiEventStatus.COMPLETED]: () => {
    // LEVEL 2: Event Type Handlers
    const eventTypeHandleMap = {
      [ApiEventType.SUBMIT_QUERY]: async () => {
        setIsSubmitting(false);
        setToast({ message: 'Success!', type: 'success' });
        reset();
      },
    };
    eventTypeHandleMap[apiEvent.type]?.();
  },

  [ApiEventStatus.ERROR]: () => {
    const eventTypeHandleMap = {
      [ApiEventType.SUBMIT_QUERY]: async () => {
        setIsSubmitting(false);
        setToast({ message: 'Error occurred.', type: 'error' });
      },
    };
    eventTypeHandleMap[apiEvent.type]?.();
  },

  [ApiEventStatus.IN_PROGRESS]: () => {},
  [ApiEventStatus.DEFAULT]: () => {},
});
```

---

## 11. Form Components

### 11.1 FormInput

**File:** `src/components/FormInput.tsx`

```typescript
interface FormInputProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  showRequired?: boolean;
  disabled?: boolean;
  readonly?: boolean;

  // Processing options
  integerOnly?: boolean;
  phoneFormat?: boolean;
  creditCardFormat?: boolean;
}
```

**Features:**
- React Hook Form Controller integration
- PrimeReact InputText component
- Input processing pipeline (integer, phone, CC formatting)
- Paste handling with validation
- Nested error retrieval for complex forms

### 11.2 FormPhoneInput

**File:** `src/components/FormPhoneInput.tsx`

```typescript
interface FormPhoneInputProps {
  name: string;
  countryCodeName: string;
  label: string;
  defaultCountryCode?: string;  // Default: +63 (Philippines)
}
```

**Country Codes Supported:**
- +63 Philippines (default)
- +1 USA/Canada
- +44 UK
- +61 Australia
- +81 Japan
- +82 South Korea
- +65 Singapore
- +60 Malaysia
- +66 Thailand
- +84 Vietnam
- +62 Indonesia
- +91 India
- +86 China
- +971 UAE
- +966 Saudi Arabia
- +49 Germany
- +33 France
- +39 Italy
- +34 Spain
- +31 Netherlands

### 11.3 FormCalendar

**File:** `src/components/FormCalendar.tsx`

```typescript
interface FormCalendarProps {
  name: string;
  label: string;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  dateFormat?: string;  // Default: 'MM/dd/yy'
}
```

---

## 12. Guards & Middleware

### 12.1 Server-Side Middleware

**File:** `src/middleware.ts`

```typescript
const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
```

### 12.2 Client-Side Auth Guard

**File:** `src/guards/AuthGuard.tsx`

```typescript
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return fallback || <Loading />;
  }

  return children;
}
```

---

## 13. Static Data

### 13.1 Tours Data

**File:** `src/data/tours.json`

**16 Tour Packages:**

1. City & Uphill Tour (8 hours, featured)
2. Moalboal & Canyoneering (Full Day, featured)
3. Cebu Safari Adventure (Full Day, featured)
4. Oslob & Simala (Full Day)
5. Cebu West Highland Tour (Full Day)
6. Simala Shrine Visit (10 hours)
7. Simala & Mountain (Full Day)
8. Oslob-Moalboal-Kawasan (Full Day)
9. Bohol Countryside (Full Day)
10. Cebu-Hagnaya Port Transfer (3 hours)
11. Cebu-Maya Port Transfer (3.5 hours)
12. Simala with Oceanpark (10 hours)
13. City Tour w/ Anjo World (10 hours)

**Tour Data Structure:**
```json
{
  "slug": "city-uphill-tour",
  "title": "City & Uphill Tour",
  "shortDescription": "Brief description",
  "description": "Full description",
  "image": "/images/tours/city-tour.png",
  "duration": "8 hours",
  "featured": true,
  "pricing": {
    "sedan": { "price": 2500, "capacity": "1-3 pax" },
    "suv": { "price": 3500, "capacity": "4-6 pax" },
    "van": { "price": 5000, "capacity": "7-14 pax" }
  },
  "itinerary": [
    { "time": "8:00 AM", "activity": "Hotel pickup" }
  ],
  "inclusions": ["Driver", "Fuel", "Parking"],
  "exclusions": ["Entrance fees", "Meals"]
}
```

---

## 14. Data Flow Diagrams

### 14.1 Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │   HeroSection    │  │  ContactSection  │  │   TourInquiryForm    │  │
│  │                  │  │                  │  │                      │  │
│  │  subscribe() ────┼──┼── subscribe() ───┼──┼── subscribe() ───────┼──┤
│  │  onSubmit() ─────┼──┼── onSubmit() ────┼──┼── onSubmit() ────────┼──┤
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
           │                      │                      │
           ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      queryService.submitQuery()                   │  │
│  │   1. sendEvent(IN_PROGRESS)                                      │  │
│  │   2. apiClient.post('/api/submit-booking', data)                 │  │
│  │   3. sendEvent(COMPLETED/ERROR)                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
           │                                      │
           ▼                                      ▼
┌──────────────────────────┐       ┌──────────────────────────────────────┐
│    API EVENT STORE       │       │           API CLIENT                  │
│  ┌────────────────────┐  │       │  ┌────────────────────────────────┐  │
│  │ currentEvent       │  │       │  │  makeRequest()                 │  │
│  │ subscribers[]      │  │       │  │    ├─ buildUrl()               │  │
│  │                    │  │       │  │    ├─ buildHeaders()           │  │
│  │ sendEvent()        │  │       │  │    ├─ fetch()                  │  │
│  │ subscribe()        │  │       │  │    ├─ handleTokenRefresh()     │  │
│  └────────────────────┘  │       │  │    └─ handleErrorResponse()    │  │
│           │              │       │  └────────────────────────────────┘  │
│           ▼              │       │              │                       │
│  ┌────────────────────┐  │       │              ▼                       │
│  │ Notify Subscribers │  │       │  ┌────────────────────────────────┐  │
│  │ (All Components)   │  │       │  │     loadingBarStore            │  │
│  └────────────────────┘  │       │  │  incrementRequests()           │  │
└──────────────────────────┘       │  │  decrementRequests()           │  │
                                   │  └────────────────────────────────┘  │
                                   │              │                       │
                                   │              ▼                       │
                                   │  ┌────────────────────────────────┐  │
                                   │  │        userStore               │  │
                                   │  │  setTokens() / clearUser()     │  │
                                   │  └────────────────────────────────┘  │
                                   └──────────────────────────────────────┘
```

### 14.2 Request Lifecycle

```
1. User submits form
       │
       ▼
2. Component calls submitQuery(data)
       │
       ▼
3. Service emits IN_PROGRESS event
       │
       ├──► All subscribed components receive event
       │    └──► Components show loading states
       │
       ▼
4. apiClient.post() is called
       │
       ├──► loadingBarStore.incrementRequests()
       │
       ▼
5. fetch() sends HTTP request
       │
       ├─── 401 Expired Token ───┐
       │                         ▼
       │               handleTokenRefresh()
       │                         │
       │               ┌─────────┴─────────┐
       │               │                   │
       │            Success             Failure
       │               │                   │
       │               ▼                   ▼
       │         Retry request      clearUser()
       │                               throw
       │
       ├─── Success ───┐
       │               ▼
       │    decrementRequests()
       │    Service emits COMPLETED event
       │         └──► Components: hide loading, show success, reset form
       │
       └─── Error ─────┐
                       ▼
            decrementRequests()
            Service emits ERROR event
                 └──► Components: hide loading, show error message
```

---

## 15. Key Patterns

### 15.1 Persistent State with localStorage

```typescript
// User store syncs to localStorage automatically
const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      // ...
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 15.2 Pub/Sub Event System

```typescript
// Subscribe in component
const unsubscribe = useApiEventStore.getState().subscribe((event) => {
  if (event?.status === ApiEventStatus.COMPLETED) {
    showSuccessToast();
  }
});

// Cleanup on unmount
return () => unsubscribe();
```

### 15.3 Zod + React Hook Form Integration

```typescript
const methods = useForm<ContactFormData>({
  resolver: zodResolver(contactFormSchema),
  mode: 'onChange',
  defaultValues: {
    fullName: '',
    email: '',
    // ...
  },
});
```

### 15.4 Cross-Component Communication

```typescript
// DriverBanner dispatches event
window.dispatchEvent(new CustomEvent('addDriverToBooking'));

// ContactSection listens
useEffect(() => {
  const handleAddDriver = () => setValue('addDriver', true);
  window.addEventListener('addDriverToBooking', handleAddDriver);
  return () => window.removeEventListener('addDriverToBooking', handleAddDriver);
}, []);
```

### 15.5 Toast Notifications

```typescript
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

// Auto-dismiss after 5 seconds
useEffect(() => {
  if (toast) {
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }
}, [toast]);
```

---

## 16. Critical Files Reference

### Core Infrastructure

| File | Purpose |
|------|---------|
| `src/services/api-client.ts` | HTTP client with interceptors |
| `src/stores/event.store.ts` | API event pub/sub system |
| `src/stores/user.store.ts` | Auth state management |
| `src/stores/loading-bar.store.ts` | Request tracking |
| `src/core/config.ts` | Environment configuration |

### Types & Validation

| File | Purpose |
|------|---------|
| `src/models/api-event.ts` | Event type definitions |
| `src/models/user.types.ts` | User interfaces |
| `src/models/validation-schemas.ts` | Zod validation schemas |
| `src/models/booking.schema.ts` | Booking form schemas |
| `src/types/tour.ts` | Tour data types |

### Components

| File | Purpose |
|------|---------|
| `src/components/landing/HeroSection.tsx` | Quick booking form |
| `src/components/landing/ContactSection.tsx` | Contact form |
| `src/components/tours/TourInquiryForm.tsx` | Tour inquiry form |
| `src/components/FormInput.tsx` | Text input component |
| `src/components/FormPhoneInput.tsx` | Phone input with country code |

### Configuration

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with providers |
| `src/app/globals.css` | Theme & global styles |
| `src/middleware.ts` | Route protection |
| `.env.local` | Environment variables |

---

## Summary

EasyRides implements a **modern, type-safe architecture** with:

1. **Robust API Layer**: Native Fetch wrapper with Axios-like interceptors, automatic token refresh, and centralized error handling

2. **Event-Driven State**: Custom pub/sub system enabling loose coupling between services and components

3. **Type Safety**: Zod schemas providing runtime validation + TypeScript type inference

4. **Form Excellence**: React Hook Form + custom components with formatting, validation, and accessibility

5. **Performance**: Static generation for tours, optimized images, loading state management

6. **Developer Experience**: Path aliases, organized folder structure, consistent patterns

This architecture scales well for adding new features while maintaining code quality and user experience consistency.
