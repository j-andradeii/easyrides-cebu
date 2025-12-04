# EasyRides Next.js Project Skill

Use this skill when implementing features in this Next.js project. Follow all patterns and guidelines below to ensure consistency.

---

## 1. Tech Stack & Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.5 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first CSS |
| PrimeReact | 10.8.0 | Component library |
| PrimeIcons | 7.0.0 | Icon library |
| Zustand | 5.0.8 | State management |
| React Hook Form | 7.67.0 | Form handling |
| Zod | 4.1.13 | Schema validation |
| googleapis | 166.0.0 | Google Sheets API |

---

## 2. Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Route Handlers
│   │   └── [endpoint]/route.ts
│   ├── [page]/             # Page routes
│   │   ├── page.tsx        # Page component
│   │   └── layout.tsx      # Optional layout
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles & theme
│
├── components/             # Reusable UI Components
│   ├── landing/            # Landing page sections
│   ├── tours/              # Tour-related components
│   ├── Form*.tsx           # Form components
│   └── index.ts            # Barrel export
│
├── core/                   # Utilities & Configuration
│   ├── config.ts           # Type-safe env config
│   ├── constants.ts        # App constants
│   ├── utils.ts            # Helper functions
│   ├── form-messages.ts    # Validation messages
│   └── index.ts            # Barrel export
│
├── stores/                 # Zustand State Management
│   ├── user.store.ts       # User/auth state
│   ├── event.store.ts      # Event pub-sub
│   ├── resettable.store.ts # Resettable state
│   └── index.ts            # Barrel export
│
├── models/                 # Types & Validation Schemas
│   ├── [entity].types.ts   # TypeScript interfaces
│   ├── [entity].schema.ts  # Zod schemas
│   └── index.ts            # Barrel export
│
├── services/               # API Clients & Business Logic
│   ├── api-client.ts       # Fetch wrapper
│   └── index.ts            # Barrel export
│
├── types/                  # Additional TypeScript definitions
│   └── [entity].ts
│
├── data/                   # Static data (JSON)
│   └── [collection].json
│
├── hooks/                  # Custom React Hooks
│   ├── use[Name].ts
│   └── index.ts            # Barrel export
│
├── guards/                 # Route Protection Components
│   ├── AuthGuard.tsx
│   └── index.ts            # Barrel export
│
├── layouts/                # Page Layouts
│   ├── MainLayout.tsx
│   ├── AuthLayout.tsx
│   └── index.ts            # Barrel export
│
├── modules/                # Feature Modules (large features)
│   └── [feature-name]/
│
└── middleware.ts           # Next.js Middleware
```

### Path Aliases

Always use path aliases for imports:

```typescript
// CORRECT - Use path aliases
import { FormInput, FormSelect } from '@/components';
import { useUserStore } from '@/stores';
import { bookingSchema } from '@/models';
import { apiClient } from '@/services';
import { HTTP_STATUS, ROUTES } from '@/core';
import { useApiEvents } from '@/hooks';

// INCORRECT - Relative imports for cross-directory
import { FormInput } from '../../../components/FormInput';
```

**Available Aliases:**
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/core/*` → `./src/core/*`
- `@/guards/*` → `./src/guards/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/layouts/*` → `./src/layouts/*`
- `@/models/*` → `./src/models/*`
- `@/modules/*` → `./src/modules/*`
- `@/services/*` → `./src/services/*`
- `@/stores/*` → `./src/stores/*`
- `@/assets/*` → `./src/assets/*`

---

## 3. Component Patterns

### 3.1 Server Components (Default)

Page components and layouts are Server Components by default:

```typescript
// src/app/tours/page.tsx
import { TourCard } from '@/components/tours/TourCard';
import toursData from '@/data/tours.json';

export default function ToursPage() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          Our Tours
        </h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toursData.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 3.2 Client Components

Add `'use client'` directive when using:
- React hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Browser APIs
- Third-party client libraries

```typescript
// src/components/landing/HeroSection.tsx
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const heroSchema = z.object({
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour']),
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

type HeroFormData = z.infer<typeof heroSchema>;

export function HeroSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      serviceType: 'car-rental',
      phone: '',
    },
  });

  const onSubmit = async (data: HeroFormData) => {
    setIsSubmitting(true);
    try {
      // Submit logic
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-coral/10 to-mango/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            {/* Form content */}
          </form>
        </FormProvider>
      </div>
    </section>
  );
}
```

### 3.3 Landing Section Component Pattern

Use this pattern for landing page sections:

```typescript
// src/components/landing/FeatureSection.tsx

// 1. Define data outside component (static)
const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M..." />
      </svg>
    ),
    title: 'Feature Title',
    description: 'Feature description text here.',
  },
  // ... more items
];

// 2. Export named function component
export function FeatureSection() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-palm-light/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white text-coral px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm border border-coral/20">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M..." clipRule="evenodd" />
            </svg>
            Section Label
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Section <span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">Highlight</span> Title
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Section description paragraph.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-coral/10 to-mango/10 rounded-xl flex items-center justify-center text-coral flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-coral transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 3.4 Barrel Exports

Create `index.ts` files for clean imports:

```typescript
// src/components/index.ts
/**
 * Components Export
 *
 * Centralized export for all shared components
 */

export * from './FormError';
export * from './FormInput';
export * from './FormTextarea';
export * from './FormSelect';
export * from './FormCalendar';
export * from './FormCheckbox';
export * from './FormPhoneInput';
```

---

## 4. Form Implementation

### 4.1 Zod Schema Definition

Define schemas in `src/models/`:

```typescript
// src/models/booking.schema.ts
import { z } from 'zod';

// Form-specific schema
export const quickBookingSchema = z.object({
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour']),
  vehicleType: z.enum(['sedan', 'suv', 'van']).optional(),
  preferredDate: z.string().min(1, 'Please select a date'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  source: z.string().default('hero-quick-form'),
});

export type QuickBookingFormData = z.infer<typeof quickBookingSchema>;

// Full contact form schema
export const contactFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  serviceType: z.enum(['car-rental', 'airport-transfer', 'tour', 'custom']),
  preferredDate: z.string().optional(),
  message: z.string().max(1000, 'Message is too long').optional(),
  source: z.string().default('contact-form'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
```

### 4.2 Form Component with React Hook Form

```typescript
// src/components/tours/TourInquiryForm.tsx
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormSelect, FormCalendar, FormTextarea, FormCheckbox } from '@/components';
import { contactFormSchema, type ContactFormData } from '@/models';

interface TourInquiryFormProps {
  tourName: string;
  onSuccess?: () => void;
}

export function TourInquiryForm({ tourName, onSuccess }: TourInquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      serviceType: 'tour',
      preferredDate: '',
      message: `I'm interested in the ${tourName} tour.`,
      source: `tour-inquiry-${tourName}`,
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setToast({ type: 'success', message: 'Inquiry submitted successfully!' });
        methods.reset();
        onSuccess?.();
      } else {
        throw new Error('Failed to submit');
      }
    } catch {
      setToast({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {/* Toast notification */}
        {toast && (
          <div className={`p-4 rounded-lg ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {toast.message}
          </div>
        )}

        <FormInput
          name="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          showRequired
        />

        <FormInput
          name="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          showRequired
        />

        <FormInput
          name="phone"
          label="Phone Number"
          placeholder="+63 XXX XXX XXXX"
          showRequired
        />

        <FormCalendar
          name="preferredDate"
          label="Preferred Date"
          placeholder="Select a date"
        />

        <FormTextarea
          name="message"
          label="Message"
          placeholder="Any special requests?"
          rows={4}
        />

        <FormCheckbox
          name="addDriver"
          label="I need a professional driver"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-gradient-to-r from-coral to-mango text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </form>
    </FormProvider>
  );
}
```

### 4.3 Reusable Form Input Component

```typescript
// src/components/FormInput.tsx
'use client';

import { useId } from 'react';
import { InputText } from 'primereact/inputtext';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

interface FormInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  showRequired?: boolean;
  showLabel?: boolean;
  className?: string;
  inputClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  disabled = false,
  showRequired = false,
  showLabel = true,
  className = '',
  inputClassName = '',
}) => {
  const { control, formState: { errors } } = useFormContext();

  // Get nested error for field
  const getNestedError = (errors: Record<string, unknown>, path: string): string | undefined => {
    const parts = path.split('.');
    let current: Record<string, unknown> = errors;
    for (const part of parts) {
      if (!current[part]) return undefined;
      current = current[part] as Record<string, unknown>;
    }
    return current.message as string | undefined;
  };

  const error = getNestedError(errors, name);
  const uniqueId = `${name}-${useId()}`;

  return (
    <div className={`mb-4 ${className}`}>
      {showLabel && label && (
        <label htmlFor={uniqueId} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {showRequired && <span className="text-cebu-red ml-1">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="w-full">
            <InputText
              id={uniqueId}
              type={type}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700 bg-white transition-colors
                ${fieldState.invalid ? 'border-cebu-red' : 'border-slate-200'}
                ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}
                ${inputClassName}
              `}
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
            />
            {error && <FormError error={error} />}
          </div>
        )}
      />
    </div>
  );
};

export default FormInput;
```

---

## 5. State Management (Zustand)

### 5.1 Persistent User Store

```typescript
// src/stores/user.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      clearUser: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 5.2 Event Pub-Sub Store

```typescript
// src/stores/event.store.ts
import { create } from 'zustand';

export type EventType = 'API_SUCCESS' | 'API_ERROR' | 'NOTIFICATION' | 'CUSTOM';

export interface AppEvent {
  id: string;
  type: EventType;
  status: 'success' | 'error' | 'info' | 'warning';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

type EventCallback = (event: AppEvent) => void;

interface EventState {
  events: AppEvent[];
  subscribers: Map<EventType, Set<EventCallback>>;

  emit: (event: Omit<AppEvent, 'id' | 'timestamp'>) => void;
  subscribe: (type: EventType, callback: EventCallback) => () => void;
  clearEvents: () => void;
  removeEvent: (id: string) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  subscribers: new Map(),

  emit: (eventData) => {
    const event: AppEvent = {
      ...eventData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      events: [...state.events, event],
    }));

    // Notify subscribers
    const subscribers = get().subscribers.get(eventData.type);
    if (subscribers) {
      subscribers.forEach((callback) => callback(event));
    }
  },

  subscribe: (type, callback) => {
    const subscribers = get().subscribers;
    if (!subscribers.has(type)) {
      subscribers.set(type, new Set());
    }
    subscribers.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.get(type)?.delete(callback);
    };
  },

  clearEvents: () => set({ events: [] }),

  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),
}));
```

### 5.3 Resettable Store Pattern

```typescript
// src/stores/resettable.store.ts
import { create } from 'zustand';

interface FilterState {
  search: string;
  category: string;
  sortBy: string;
  page: number;
}

const initialState: FilterState = {
  search: '',
  category: '',
  sortBy: 'newest',
  page: 1,
};

interface ResettableState extends FilterState {
  setSearch: (search: string) => void;
  setCategory: (category: string) => void;
  setSortBy: (sortBy: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useResettableStore = create<ResettableState>((set) => ({
  ...initialState,

  setSearch: (search) => set({ search, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPage: (page) => set({ page }),
  reset: () => set(initialState),
}));
```

---

## 6. API Routes

### 6.1 Route Handler Pattern

```typescript
// src/app/api/submit-booking/route.ts
import { NextResponse } from 'next/server';
import { bookingSubmissionSchema } from '@/models/booking.schema';

interface SheetResult {
  success: boolean;
  message: string;
}

async function saveToDatabase(data: Record<string, unknown>): Promise<SheetResult> {
  // Check configuration
  const isConfigured = process.env.DATABASE_URL;

  if (!isConfigured) {
    // Development fallback - log to console
    console.log('=== New Submission ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('======================');
    return { success: true, message: 'Logged locally (DB not configured)' };
  }

  try {
    // Production: Save to database
    // await db.insert(submissions).values(data);
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validationResult = bookingSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid submission data',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Save to database
    const result = await saveToDatabase(data);

    return NextResponse.json({
      ...result,
      message: 'Inquiry received! We will contact you shortly.',
    });
  } catch (error) {
    console.error('Submission error:', error);

    return NextResponse.json(
      { error: 'Failed to process. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}
```

### 6.2 API Client Service

```typescript
// src/services/api-client.ts
import { useEventStore } from '@/stores/event.store';
import { useUserStore } from '@/stores/user.store';

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseURL = baseURL;
  }

  private async buildRequest(endpoint: string, options: RequestInit = {}): Promise<Request> {
    const url = `${this.baseURL}${endpoint}`;
    const token = useUserStore.getState().token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new Request(url, { ...options, headers });
  }

  private async handleResponse<T>(response: Response, endpoint: string): Promise<ApiResponse<T>> {
    const eventStore = useEventStore.getState();

    if (response.ok) {
      const data = await response.json();
      eventStore.emit({
        type: 'API_SUCCESS',
        status: 'success',
        message: `Request to ${endpoint} successful`,
        metadata: { endpoint, status: response.status },
      });
      return { data, status: response.status, statusText: response.statusText };
    }

    // Handle error
    const error = await this.handleError(response, endpoint);
    throw error;
  }

  private async handleError(response: Response, endpoint: string): Promise<ApiError> {
    const eventStore = useEventStore.getState();
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const error: ApiError = {
      message: (errorData as { message?: string })?.message || 'An error occurred',
      status: response.status,
      errors: (errorData as { errors?: Record<string, string[]> })?.errors,
    };

    eventStore.emit({
      type: 'API_ERROR',
      status: 'error',
      message: error.message,
      metadata: { endpoint, status: response.status, errors: error.errors },
    });

    // Handle 401 - clear session
    if (response.status === 401) {
      useUserStore.getState().clearUser();
    }

    return error;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, { ...options, method: 'GET' });
    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const request = await this.buildRequest(endpoint, { ...options, method: 'DELETE' });
    const response = await fetch(request);
    return this.handleResponse<T>(response, endpoint);
  }
}

export const apiClient = new ApiClient();
```

---

## 7. Custom Hooks

### 7.1 useApiEvents Hook

```typescript
// src/hooks/useApiEvents.ts
'use client';

import { useEffect } from 'react';
import { useEventStore, EventType, AppEvent } from '@/stores/event.store';

/**
 * Subscribe to specific API event types
 */
export function useApiEvents(
  eventType: EventType,
  callback: (event: AppEvent) => void
) {
  const subscribe = useEventStore((state) => state.subscribe);

  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return () => unsubscribe();
  }, [eventType, callback, subscribe]);
}

/**
 * Get all events from store
 */
export function useEvents() {
  return useEventStore((state) => state.events);
}

/**
 * Get event actions
 */
export function useEventActions() {
  return {
    emit: useEventStore((state) => state.emit),
    clearEvents: useEventStore((state) => state.clearEvents),
    removeEvent: useEventStore((state) => state.removeEvent),
  };
}
```

### 7.2 Creating New Hooks

Follow this pattern for new hooks:

```typescript
// src/hooks/useDebounce.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a value with specified delay
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 8. Styling Guidelines

### 8.1 Color Palette

Use these Tailwind color classes:

| Color | CSS Variable | Tailwind Class | Usage |
|-------|--------------|----------------|-------|
| Primary Red | `--cebu-red` | `text-cebu-red`, `bg-cebu-red` | Primary actions, CTAs |
| Coral (alias) | `--coral` | `text-coral`, `bg-coral` | Same as cebu-red |
| Sunset Orange | `--sunset-orange` | `text-sunset-orange` | Secondary accent |
| Mango (alias) | `--mango` | `text-mango`, `bg-mango` | Gradients, highlights |
| Palm Green | `--palm` | `text-palm`, `bg-palm` | Success, nature elements |
| Cream | `--cream` | `bg-cream` | Background |
| Palm Black | `--palm-black` | `text-palm-black` | Dark text |

### 8.2 Common Tailwind Patterns

```typescript
// Section wrapper
<section className="py-24 bg-slate-50 relative overflow-hidden">

// Container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Gradient text
<span className="bg-gradient-to-r from-coral to-mango bg-clip-text text-transparent">

// Card with hover
<div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

// Icon container
<div className="w-14 h-14 bg-gradient-to-br from-coral/10 to-mango/10 rounded-xl flex items-center justify-center text-coral">

// Primary button
<button className="py-3 px-6 bg-gradient-to-r from-coral to-mango text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300">

// Form input
<input className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700">

// Badge/Tag
<div className="inline-flex items-center gap-2 bg-white text-coral px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-coral/20">

// Grid layouts
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

### 8.3 Typography

```css
/* Headers use DM Sans */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-dm-sans);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* Body uses Poppins */
body {
  font-family: var(--font-poppins);
  font-weight: 400;
  line-height: 1.6;
}
```

### 8.4 Responsive Breakpoints

```typescript
// Mobile-first approach
<div className="
  text-base          // Mobile
  sm:text-lg         // 640px+
  md:text-xl         // 768px+
  lg:text-2xl        // 1024px+
  xl:text-3xl        // 1280px+
">

// Grid example
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

---

## 9. Constants Pattern

### 9.1 Core Constants

```typescript
// src/core/constants.ts

/**
 * HTTP Status Codes
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

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  USER: 'user-storage',
  AUTH_TOKEN: 'auth-token',
  THEME: 'theme-preference',
  LANGUAGE: 'language-preference',
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TOURS: '/tours',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
```

---

## 10. Code Style Rules

### 10.1 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HeroSection`, `FormInput` |
| Hooks | camelCase with `use` prefix | `useApiEvents`, `useDebounce` |
| Stores | camelCase with `.store.ts` suffix | `user.store.ts` |
| Schemas | camelCase with `Schema` suffix | `bookingSchema` |
| Types | PascalCase | `User`, `BookingFormData` |
| Constants | SCREAMING_SNAKE_CASE | `HTTP_STATUS`, `ROUTES` |
| Functions | camelCase | `formatDate`, `handleSubmit` |
| Files | kebab-case or camelCase | `api-client.ts`, `FormInput.tsx` |

### 10.2 Import Order

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { NextResponse } from 'next/server';

// 2. Third-party libraries
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 3. Path alias imports (alphabetical by alias)
import { FormInput, FormSelect } from '@/components';
import { HTTP_STATUS, ROUTES } from '@/core';
import { useApiEvents } from '@/hooks';
import { bookingSchema } from '@/models';
import { apiClient } from '@/services';
import { useUserStore } from '@/stores';

// 4. Relative imports (if needed)
import { localHelper } from './helpers';

// 5. Types (if separate)
import type { User } from '@/models';
```

### 10.3 Export Patterns

```typescript
// Named exports for components (preferred)
export function ComponentName() { }
export const ComponentName: React.FC<Props> = () => { };

// Default export only for pages
export default function PageName() { }

// Const exports for utilities
export const helperFunction = () => { };
export const CONSTANT_VALUE = 'value';

// Type exports
export type TypeName = { };
export interface InterfaceName { }
```

---

## 11. Common Pitfalls to Avoid

### 11.1 Client/Server Component Issues

```typescript
// WRONG - Using hooks in server component
// src/app/page.tsx (server component by default)
import { useState } from 'react'; // Error!

// CORRECT - Add 'use client' directive
'use client';
import { useState } from 'react';
```

### 11.2 Form Context Issues

```typescript
// WRONG - Using form components outside FormProvider
<FormInput name="email" /> // Error: Cannot read useFormContext

// CORRECT - Wrap with FormProvider
<FormProvider {...methods}>
  <FormInput name="email" />
</FormProvider>
```

### 11.3 Hydration Mismatches

```typescript
// WRONG - Different content on server vs client
{typeof window !== 'undefined' && <ClientOnlyContent />}

// CORRECT - Use useEffect for client-only content
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### 11.4 Zustand Store Access

```typescript
// WRONG - Calling hook outside React component
const user = useUserStore().user; // In regular function

// CORRECT - Use getState() outside components
const user = useUserStore.getState().user;

// CORRECT - Use hook inside components
function Component() {
  const user = useUserStore((state) => state.user);
}
```

### 11.5 API Route Validation

```typescript
// WRONG - No validation
export async function POST(request: Request) {
  const body = await request.json();
  // Using body directly - dangerous!
}

// CORRECT - Validate with Zod
export async function POST(request: Request) {
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }
  // Use result.data
}
```

### 11.6 Missing Error Boundaries

```typescript
// CORRECT - Add error handling for async operations
const onSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  try {
    await submitData(data);
    setToast({ type: 'success', message: 'Success!' });
  } catch (error) {
    setToast({ type: 'error', message: 'Something went wrong.' });
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 12. Quick Reference

### New Component Checklist
- [ ] Create in appropriate directory (`components/[feature]/`)
- [ ] Add `'use client'` if using hooks/events
- [ ] Use named export
- [ ] Follow Tailwind patterns (colors, spacing)
- [ ] Add to barrel export (`index.ts`)

### New Form Checklist
- [ ] Create Zod schema in `models/`
- [ ] Export type with `z.infer<typeof schema>`
- [ ] Use `FormProvider` wrapper
- [ ] Use existing form components (FormInput, etc.)
- [ ] Handle loading/error states
- [ ] Show toast notifications

### New API Route Checklist
- [ ] Create in `app/api/[endpoint]/route.ts`
- [ ] Validate input with Zod
- [ ] Return proper status codes
- [ ] Handle errors gracefully
- [ ] Log for debugging (dev mode)

### New Store Checklist
- [ ] Create in `stores/[name].store.ts`
- [ ] Define interface for state + actions
- [ ] Use `persist` middleware if needed
- [ ] Add to barrel export
- [ ] Document usage
