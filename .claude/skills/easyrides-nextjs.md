# EasyRideCebu Next.js Project Skill

Use this skill when working on the EasyRideCebu application - a car rental and tour services landing page built with Next.js 16, React 19, Tailwind CSS v4, and TypeScript.

## Project Overview

EasyRideCebu is a modern landing page for a car rental and tour services business in Cebu, Philippines. The application features:
- Landing page with multiple sections (Hero, Services, Fleet, Tours, Pricing, Contact)
- Booking form with API integration
- Google Sheets integration for lead capture
- Responsive design with tropical-themed color palette
- Authentication scaffolding (middleware, guards, stores)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.5 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Utility-first CSS (v4 with `@theme inline`) |
| Zustand | ^5.0.8 | State management |
| Zod | ^4.1.13 | Schema validation |
| React Hook Form | ^7.67.0 | Form handling |
| @hookform/resolvers | ^5.2.2 | Zod resolver for RHF |

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── submit-booking/   # Booking form submission endpoint
│   ├── auth-module/          # Authentication pages
│   ├── dashboard/            # Protected dashboard page
│   ├── globals.css           # Global styles & Tailwind theme
│   ├── layout.tsx            # Root layout with metadata
│   └── page.tsx              # Landing page (home)
├── components/
│   ├── landing/              # Landing page sections
│   │   ├── Navigation.tsx    # Fixed header with logo
│   │   ├── HeroSection.tsx   # Hero with booking form
│   │   ├── ServicesSection.tsx
│   │   ├── FleetSection.tsx
│   │   ├── ToursSection.tsx
│   │   ├── TransferRatesSection.tsx
│   │   ├── WhyChooseUs.tsx
│   │   ├── ContactSection.tsx
│   │   ├── DriverBanner.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts          # Barrel export
│   ├── FormInput.tsx         # Reusable form input with RHF
│   ├── FormTextarea.tsx      # Reusable textarea with RHF
│   ├── FormSelect.tsx        # Reusable select with RHF
│   └── index.ts
├── core/                     # Core utilities
│   ├── config.ts             # App configuration
│   ├── constants.ts          # App constants
│   └── utils.ts              # Utility functions
├── guards/                   # Route protection
│   └── AuthGuard.tsx         # Authentication guard component
├── hooks/                    # Custom React hooks
│   └── useApiEvents.ts       # API event handling hook
├── layouts/                  # Layout components
│   ├── MainLayout.tsx
│   └── AuthLayout.tsx
├── models/                   # TypeScript types & Zod schemas
│   ├── user.types.ts         # User type definitions
│   ├── booking.schema.ts     # Booking form Zod schemas
│   └── validation-schemas.ts # Shared validation schemas
├── modules/                  # Feature modules (example)
│   └── example-feature/
├── services/                 # API services
│   ├── api-client.ts         # Base API client
│   └── index.ts
├── stores/                   # Zustand stores
│   ├── user.store.ts         # User authentication state
│   ├── event.store.ts        # Event/notification state
│   ├── resettable.store.ts   # Resettable store pattern
│   └── index.ts
└── middleware.ts             # Next.js middleware for auth
```

## Color Palette (Tailwind CSS v4)

The project uses a tropical theme based on the company logo. Colors are defined in `globals.css` using CSS variables with `@theme inline`:

### Brand Colors
```css
/* Primary - Red (from car in logo) */
cebu-red: #DC2626
cebu-red-light: #EF4444
cebu-red-dark: #B91C1C

/* Sunset Orange */
sunset-orange: #F59E0B
sunset-orange-light: #FBBF24
sunset-orange-dark: #D97706

/* Sunset Yellow */
sunset-yellow: #FFC107
sunset-yellow-light: #FFEB3B
sunset-yellow-dark: #FFA000

/* Palm Black (from palm trees) */
palm-black: #1A1A1A
palm-black-light: #374151
palm-black-dark: #0F0F0F

/* Cream Background */
cream: #F5F0E1
cream-light: #FAF8F3
cream-dark: #E8E0CC
```

### Accent Colors
```css
/* Tropical Palm Green */
palm: #2D6A4F
palm-light: #40916C
palm-dark: #1B4332

/* Papaya (warm accent) */
papaya: #FFAB76
papaya-light: #FFBF94
papaya-dark: #E89560

/* Terracotta (earthy warm) */
terracotta: #E07A5F
terracotta-light: #E99680
terracotta-dark: #C96A50

/* Hibiscus (tropical red) */
hibiscus: #C94C4C
hibiscus-light: #D86B6B
hibiscus-dark: #A83D3D
```

### Legacy Aliases (for compatibility)
```css
coral → cebu-red
mango → sunset-orange
golden → sunset-yellow
```

## Key Patterns

### 1. Tailwind CSS v4 Theme Configuration

Colors are defined using CSS variables in `:root` and exposed to Tailwind via `@theme inline`:

```css
@import "tailwindcss";

:root {
  --cebu-red: #DC2626;
  /* ... other variables */
}

@theme inline {
  --color-cebu-red: var(--cebu-red);
  /* ... expose to Tailwind */
}
```

Usage in components:
```tsx
<button className="bg-cebu-red hover:bg-cebu-red-dark text-white">
  Book Now
</button>

<div className="bg-gradient-to-r from-cebu-red to-sunset-orange">
  Gradient background
</div>
```

### 2. Zustand Store Pattern

```typescript
// Persistent store with localStorage
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token, isAuthenticated: true }),
      clearUser: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 3. Zod Schema Validation

```typescript
import { z } from 'zod';

export const bookingSchema = z.object({
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour']),
  vehicleType: z.enum(['sedan', 'suv', 'van']).optional(),
  preferredDate: z.string().min(1, 'Please select a date'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
```

### 4. API Route Pattern

```typescript
// src/app/api/submit-booking/route.ts
import { NextResponse } from 'next/server';
import { bookingSubmissionSchema } from '@/models/booking.schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = bookingSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Process validated data
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### 5. Form Component Pattern with React Hook Form

```tsx
'use client';

import { forwardRef } from 'react';
import { FieldError } from 'react-hook-form';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FieldError;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, ...props }, ref) => (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-md ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
);
```

### 6. Landing Page Section Pattern

Each landing section follows this structure:
```tsx
export function SectionName() {
  return (
    <section id="section-id" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-coral/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            Badge Text
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Section <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Title</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Section description
          </p>
        </div>

        {/* Section Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cards or content */}
        </div>
      </div>
    </section>
  );
}
```

### 7. Middleware Authentication Pattern

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!token;
  const { pathname } = request.nextUrl;

  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
```

## Path Aliases

Configured in `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/core/*": ["./src/core/*"],
    "@/guards/*": ["./src/guards/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/layouts/*": ["./src/layouts/*"],
    "@/models/*": ["./src/models/*"],
    "@/modules/*": ["./src/modules/*"],
    "@/services/*": ["./src/services/*"],
    "@/stores/*": ["./src/stores/*"]
  }
}
```

## Environment Variables

Required for Google Sheets integration:
```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Best Practices for This Project

1. **Color Usage**: Always use the defined color palette (cebu-red, sunset-orange, palm, etc.) instead of arbitrary colors
2. **Component Exports**: Use barrel exports (`index.ts`) for clean imports
3. **Form Validation**: Use Zod schemas for all form validation
4. **State Management**: Use Zustand stores for global state, persist sensitive data appropriately
5. **API Routes**: Validate all incoming data with Zod before processing
6. **Responsive Design**: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
7. **Gradient Buttons**: Use `bg-gradient-to-r from-cebu-red to-sunset-orange` for primary CTAs
8. **Section Backgrounds**: Alternate between `bg-white`, `bg-slate-50`, and `bg-cream` for visual rhythm
