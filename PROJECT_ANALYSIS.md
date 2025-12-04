# EasyRides App - Comprehensive Project Analysis

> Generated: December 4, 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Technologies & Frameworks](#3-technologies--frameworks)
4. [Dependencies](#4-dependencies)
5. [Configuration](#5-configuration)
6. [Source Code Organization](#6-source-code-organization)
7. [Data Layer & Storage](#7-data-layer--storage)
8. [API Routes](#8-api-routes)
9. [Pages & Routing](#9-pages--routing)
10. [Components](#10-components)
11. [Styling Approach](#11-styling-approach)
12. [State Management](#12-state-management)
13. [Authentication](#13-authentication)
14. [Special Features](#14-special-features)
15. [Custom Hooks](#15-custom-hooks)
16. [Deployment](#16-deployment)
17. [Project Statistics](#17-project-statistics)
18. [Architectural Patterns](#18-architectural-patterns)

---

## 1. Project Overview

| Attribute | Value |
|-----------|-------|
| **Project Name** | EasyRides App (EasyRideCebu) |
| **Type** | Next.js 15 Frontend Application |
| **Purpose** | Car rental and tour booking platform for Cebu, Philippines |
| **Status** | Active Development |
| **Branch** | main (clean) |

### Key Features
- Quick booking system
- Tour packages with detailed itineraries
- Vehicle rental services
- Airport transfers
- Google Sheets integration for booking storage
- Facebook Messenger integration

---

## 2. Project Structure

```
easyrides-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   └── submit-booking/   # Booking API endpoint
│   │   ├── auth-module/          # Authentication pages
│   │   ├── tours/                # Tour pages
│   │   │   ├── page.tsx          # Tours listing
│   │   │   └── [slug]/           # Dynamic tour details
│   │   ├── dashboard/            # User dashboard
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # Reusable UI Components
│   │   ├── landing/              # Landing page components (10)
│   │   ├── tours/                # Tour components (2)
│   │   ├── Form*.tsx             # Form components (8)
│   │   └── FacebookMessenger.tsx
│   │
│   ├── core/                     # Utilities & Configuration
│   │   ├── config.ts             # Type-safe config
│   │   ├── constants.ts          # App constants
│   │   ├── utils.ts              # Helper functions
│   │   └── form-messages.ts      # Validation messages
│   │
│   ├── stores/                   # Zustand State Management
│   │   ├── user.store.ts         # User auth state
│   │   ├── event.store.ts        # Event pub-sub
│   │   └── resettable.store.ts   # Resettable state
│   │
│   ├── models/                   # Types & Validation
│   │   ├── user.types.ts
│   │   ├── booking.schema.ts     # Zod schemas
│   │   └── validation-schemas.ts
│   │
│   ├── services/                 # API Clients
│   │   └── api-client.ts         # Fetch wrapper
│   │
│   ├── types/                    # TypeScript definitions
│   │   └── tour.ts
│   │
│   ├── data/                     # Static data
│   │   └── tours.json            # Tour packages
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useApiEvents.ts
│   │
│   ├── guards/                   # Route protection
│   │   └── AuthGuard.tsx
│   │
│   ├── layouts/                  # Page layouts
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   │
│   ├── modules/                  # Feature modules
│   │   └── example-feature/
│   │
│   └── middleware.ts             # Route middleware
│
├── public/                       # Static assets
│   ├── logo.jpg
│   └── images/
│
├── Configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   └── .env.local.example
│
├── Docker
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── README.md
```

---

## 3. Technologies & Frameworks

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.5 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.x | Utility-first CSS |
| PrimeReact | 10.8.0 | Component library |
| PrimeIcons | 7.0.0 | Icon library |

### State & Forms
| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 5.0.8 | State management |
| React Hook Form | 7.67.0 | Form handling |
| Zod | 4.1.13 | Schema validation |

### Integrations
| Technology | Version | Purpose |
|------------|---------|---------|
| googleapis | 166.0.0 | Google Sheets API |

---

## 4. Dependencies

### Production Dependencies
```json
{
  "@hookform/resolvers": "^5.2.2",
  "googleapis": "^166.0.0",
  "next": "16.0.5",
  "primeicons": "^7.0.0",
  "primereact": "^10.8.0",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "react-hook-form": "^7.67.0",
  "zod": "^4.1.13",
  "zustand": "^5.0.8"
}
```

### Development Dependencies
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.0.5",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## 5. Configuration

### TypeScript Configuration
- **Target:** ES2017
- **Module Resolution:** Bundler
- **JSX:** react-jsx

### Path Aliases
```typescript
@/*           → ./src/*
@/components/* → ./src/components/*
@/core/*       → ./src/core/*
@/guards/*     → ./src/guards/*
@/hooks/*      → ./src/hooks/*
@/layouts/*    → ./src/layouts/*
@/models/*     → ./src/models/*
@/modules/*    → ./src/modules/*
@/services/*   → ./src/services/*
@/stores/*     → ./src/stores/*
@/assets/*     → ./src/assets/*
```

### Environment Variables
```bash
# App Settings
NEXT_PUBLIC_APP_NAME=EasyRideCebu
NEXT_PUBLIC_APP_URL=http://localhost:3002

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
AUTH_SECRET=your-jwt-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_DEBUG_MODE=true

# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=

# Contact Information
NEXT_PUBLIC_PHONE=
NEXT_PUBLIC_WHATSAPP_LINK=
NEXT_PUBLIC_MESSENGER_PAGE_ID=
NEXT_PUBLIC_EMAIL=
```

---

## 6. Source Code Organization

### Core Module (`src/core/`)

#### config.ts
Type-safe configuration object with environment variable access.

#### constants.ts
```typescript
// HTTP Status Codes
HTTP_STATUS: { OK, CREATED, BAD_REQUEST, UNAUTHORIZED, ... }

// Storage Keys
STORAGE_KEYS: { AUTH_TOKEN, USER_DATA, THEME, ... }

// API Events
API_EVENTS: { SUCCESS, ERROR, LOADING, ... }

// Routes
ROUTES: { HOME, LOGIN, DASHBOARD, TOURS, ... }

// Validation Rules
VALIDATION: { PASSWORD_MIN_LENGTH, EMAIL_REGEX, PHONE_REGEX }
```

#### utils.ts
Helper functions: `formatDate`, `truncate`, `debounce`, `generateId`, etc.

### Models (`src/models/`)

#### Booking Schema (Zod)
```typescript
// Quick booking form validation
quickBookingSchema

// Contact form validation
contactFormSchema

// Full booking submission
bookingSubmissionSchema
```

#### Tour Types
```typescript
interface Tour {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  duration: string;
  featured: boolean;
  pricing: TourPricingOptions;  // sedan, suv, van
  itinerary: ItineraryItem[];
  inclusions: string[];
  exclusions: string[];
}
```

#### User Types
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
}
```

---

## 7. Data Layer & Storage

### Google Sheets Integration
- **Purpose:** Store booking submissions
- **Method:** Google Sheets API with service account
- **Fallback:** Console logging when unconfigured

### Static Data
- `tours.json` - 5+ curated tour packages
  - City tours
  - Canyoneering adventures
  - Water activities
  - Safari experiences

### Vehicle Types
| Type | Capacity |
|------|----------|
| Sedan | 1-3 passengers |
| SUV | 4-6 passengers |
| Van | 7-14 passengers |

---

## 8. API Routes

### POST /api/submit-booking

**Purpose:** Process booking inquiries

**Request Body:**
```typescript
{
  fullName: string;
  email: string;
  phone: string;
  serviceType: 'car-rental' | 'airport-transfer' | 'tour' | 'custom';
  preferredDate: string;
  vehicleType: string;
  message?: string;
  addDriver: boolean;
  source: string;
}
```

**Response:**
```typescript
// Success
{ success: true, message: "Booking submitted successfully" }

// Error
{ success: false, message: "Error description" }
```

**Features:**
- Zod schema validation
- Google Sheets row appending
- Timestamp tracking
- Graceful fallback

---

## 9. Pages & Routing

| Route | Description |
|-------|-------------|
| `/` | Landing page with quick booking |
| `/tours` | Tour packages listing |
| `/tours/[slug]` | Individual tour details |
| `/auth-module` | Authentication home |
| `/auth-module/new` | New user setup |
| `/dashboard` | User dashboard (protected) |

### Route Protection
- Middleware-based authentication checks
- Cookie-based token storage
- Redirect to login with return URL

---

## 10. Components

### Landing Page Components (10)
| Component | Purpose |
|-----------|---------|
| `Navigation.tsx` | Fixed header with responsive menu |
| `HeroSection.tsx` | Hero with quick booking form |
| `ServicesSection.tsx` | Services showcase |
| `FleetSection.tsx` | Vehicle fleet display |
| `DriverBanner.tsx` | Driver promotion section |
| `ToursSection.tsx` | Tour packages preview |
| `TransferRatesSection.tsx` | Pricing information |
| `WhyChooseUs.tsx` | Value proposition |
| `ContactSection.tsx` | Contact form |
| `Footer.tsx` | Footer with links |

### Form Components (8)
| Component | Purpose |
|-----------|---------|
| `FormInput.tsx` | Text input with validation |
| `FormSelect.tsx` | Dropdown selector |
| `FormTextarea.tsx` | Textarea with character count |
| `FormCalendar.tsx` | Date picker (PrimeReact) |
| `FormCheckbox.tsx` | Checkbox with label |
| `FormPhoneInput.tsx` | Phone with country code |
| `FormError.tsx` | Error message display |
| `ExampleLoginForm.tsx` | Form implementation example |

### Tour Components (2)
| Component | Purpose |
|-----------|---------|
| `TourCard.tsx` | Tour package card |
| `TourInquiryForm.tsx` | Tour booking form |

### Special Components
| Component | Purpose |
|-----------|---------|
| `FacebookMessenger.tsx` | Messenger chat widget |

---

## 11. Styling Approach

### Tailwind CSS v4 with Custom Theme

#### Color Palette
```css
--color-cebu-red: #DC2626;      /* Primary */
--color-sunset-orange: #F59E0B; /* Secondary */
--color-palm-green: #2D6A4F;    /* Accent */
--color-papaya: #FFEDD5;        /* Warm */
--color-terracotta: #D97706;    /* Warm */
--color-hibiscus: #F472B6;      /* Warm */
--color-cream: #FFFBEB;         /* Background */
```

#### Typography
- **Display Font:** DM Sans (headers)
- **Body Font:** Poppins (content)
- Google Fonts with `font-swap`

#### Design Features
- Gradient backgrounds
- Animated decorative elements
- Smooth transitions
- Mobile-responsive design
- PrimeReact component overrides

---

## 12. State Management

### Zustand Stores

#### 1. User Store (Persistent)
```typescript
interface UserStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => void;
}
```
- localStorage persistence
- Survives page refreshes

#### 2. Event Store (Pub-Sub)
```typescript
interface EventStore {
  events: Event[];
  emit: (type: EventType, payload: any) => void;
  subscribe: (type: EventType, callback: Function) => void;
  clearEvents: () => void;
}

// Event Types
type EventType = 'API_SUCCESS' | 'API_ERROR' | 'NOTIFICATION' | 'CUSTOM';
```

#### 3. Resettable Store
```typescript
interface ResettableStore {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  reset: () => void;
}
```

### API Client Integration
- Auto-injects auth tokens
- Emits API events
- Handles 401 unauthorized

---

## 13. Authentication

### Middleware Protection (`src/middleware.ts`)

**Protected Routes:**
- `/dashboard`
- `/profile`
- `/settings`

**Auth Routes:**
- `/login`
- `/register`

**Features:**
- Cookie-based token storage (`auth-token`)
- Redirect unauthenticated users to login
- Prevent authenticated users from accessing auth pages
- Return URL parameter support

### Client-Side Protection
- `AuthGuard` component for sensitive content
- Route-level authentication checks

### Token Management
| Token | Default Expiry |
|-------|----------------|
| Access Token | 15 minutes |
| Refresh Token | 7 days |

---

## 14. Special Features

### Google Sheets Integration
1. User submits booking form
2. React Hook Form validates with Zod
3. POST request to `/api/submit-booking`
4. Server validates and appends to Google Sheets
5. Returns success/error response

### Toast Notifications
- Custom toast component
- Auto-dismiss (5 seconds)
- Success/error variants
- User dismissible

### Phone Number Handling
- Country code selector (default: +63 Philippines)
- Phone number formatting
- Validation patterns

### Date Picker
- PrimeReact Calendar
- Min date validation (future dates only)
- Custom format: "MM dd, yy"

### Facebook Messenger Integration
- Chat widget integration
- Configurable page ID
- Customer support channel

---

## 15. Custom Hooks

### useApiEvents
```typescript
useApiEvents('API_SUCCESS', (event) => {
  // Handle successful API calls
});

useApiEvents('API_ERROR', (event) => {
  // Handle API errors
});
```

**Features:**
- Subscribe to specific event types
- Automatic cleanup on unmount
- Cross-component communication

---

## 16. Deployment

### Docker Configuration

#### Dockerfile
- **Base Image:** Node 20 Alpine
- **Build:** Multi-stage (deps → builder → runner)
- **Output:** Standalone mode
- **User:** Non-root (nextjs)

#### docker-compose.yml
```yaml
services:
  easyrides-app:
    build: .
    ports:
      - "3002:3002"
    restart: unless-stopped
```

### NPM Scripts
```bash
npm run dev    # Start development server
npm run build  # Create production build
npm start      # Run production server
npm run lint   # Run ESLint
```

### Production Optimizations
- Standalone output for smaller image
- Non-root user for security
- Multi-stage build for efficiency

---

## 17. Project Statistics

| Metric | Count |
|--------|-------|
| TypeScript/TSX Files | 61 |
| Component Files | 21 |
| API Routes | 1 |
| Page Routes | 6+ |
| Zustand Stores | 3 |
| Utility Functions | 15+ |
| Form Components | 8 |
| Landing Components | 10 |
| Production Dependencies | 9 |
| Dev Dependencies | 6 |

---

## 18. Architectural Patterns

### 1. Modular Architecture
Clear separation of concerns by feature and responsibility.

### 2. Type Safety
Full TypeScript coverage with Zod runtime validation.

### 3. Reactive State
Zustand stores with pub-sub event system.

### 4. Form Management
React Hook Form with Zod resolver for validation.

### 5. API Interception
Custom fetch wrapper with token injection and error handling.

### 6. Environment Configuration
Type-safe configuration object with fallbacks.

### 7. Reusable Components
Composable form elements with consistent styling.

### 8. Route Protection
Middleware + client-side guards for authentication.

### 9. Event-Driven Architecture
Cross-component communication via pub-sub pattern.

---

## Recent Development Activity

```
781b430 - update design for mobile
efe4888 - implement fix
0344174 - enhance bg
7bae5ed - update background
3aa44a9 - improve navigation and tour inquiry default add driver to true
```

**Focus Areas:**
- Mobile design optimization
- Visual enhancements
- Tour inquiry improvements

---

## Summary

The EasyRides App is a **modern, well-architected Next.js 15 application** featuring:

- Clean modular structure with clear separation of concerns
- Full type safety with TypeScript and Zod validation
- Scalable state management using Zustand patterns
- Production-ready Docker deployment configuration
- Google Sheets integration for booking management
- Responsive design with custom tropical theme
- Professional form handling with validation
- Event-driven architecture for component communication

The codebase demonstrates enterprise-level patterns and best practices suitable for a growing car rental and tour booking platform serving the Cebu, Philippines market.
