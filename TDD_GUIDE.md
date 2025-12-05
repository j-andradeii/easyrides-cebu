# Test-Driven Development (TDD) Guide for EasyRides Next.js Project

> A comprehensive guide from basic to intermediate TDD practices, tailored for this project's architecture.

---

## Table of Contents

1. [TDD Fundamentals](#1-tdd-fundamentals)
2. [Project Setup](#2-project-setup)
3. [Testing Stack Overview](#3-testing-stack-overview)
4. [Testing Zod Schemas](#4-testing-zod-schemas)
5. [Testing Zustand Stores](#5-testing-zustand-stores)
6. [Testing Custom Hooks](#6-testing-custom-hooks)
7. [Testing React Components](#7-testing-react-components)
8. [Testing Form Components](#8-testing-form-components)
9. [Testing API Routes](#9-testing-api-routes)
10. [Testing Utilities](#10-testing-utilities)
11. [Integration Testing](#11-integration-testing)
12. [Best Practices & Patterns](#12-best-practices--patterns)
13. [Common Pitfalls](#13-common-pitfalls)
14. [TDD Workflow Examples](#14-tdd-workflow-examples)

---

## 1. TDD Fundamentals

### What is TDD?

Test-Driven Development is a software development approach where you:

1. **RED** - Write a failing test first
2. **GREEN** - Write the minimum code to make the test pass
3. **REFACTOR** - Improve the code while keeping tests green

```
┌─────────────────────────────────────────────┐
│                                             │
│    ┌───────┐                                │
│    │  RED  │ Write a failing test           │
│    └───┬───┘                                │
│        │                                    │
│        ▼                                    │
│    ┌───────┐                                │
│    │ GREEN │ Make it pass (minimal code)    │
│    └───┬───┘                                │
│        │                                    │
│        ▼                                    │
│    ┌──────────┐                             │
│    │ REFACTOR │ Clean up, keep tests green  │
│    └────┬─────┘                             │
│         │                                   │
│         └──────────────► (repeat)           │
│                                             │
└─────────────────────────────────────────────┘
```

### Why TDD?

| Benefit | Description |
|---------|-------------|
| **Better Design** | Forces you to think about API before implementation |
| **Documentation** | Tests serve as living documentation |
| **Confidence** | Refactor without fear of breaking things |
| **Fewer Bugs** | Catch issues early in development |
| **Faster Debugging** | Tests pinpoint exactly what's broken |

### TDD vs Traditional Testing

| Traditional | TDD |
|-------------|-----|
| Write code first | Write test first |
| Test what exists | Define what should exist |
| Tests verify implementation | Tests drive design |
| Often skipped under pressure | Integral to workflow |

---

## 2. Project Setup

### Install Testing Dependencies

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

### Create Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/guards': path.resolve(__dirname, './src/guards'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/layouts': path.resolve(__dirname, './src/layouts'),
      '@/models': path.resolve(__dirname, './src/models'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
```

### Create Setup File

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);
```

### Add NPM Scripts

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

### Project Test Structure

```
src/
├── __tests__/                    # Integration tests
│   ├── pages/
│   │   └── tours.test.tsx
│   └── flows/
│       └── booking-flow.test.tsx
│
├── components/
│   ├── FormInput.tsx
│   └── FormInput.test.tsx        # Co-located unit tests
│
├── models/
│   ├── booking.schema.ts
│   └── booking.schema.test.ts
│
├── stores/
│   ├── user.store.ts
│   └── user.store.test.ts
│
├── hooks/
│   ├── useApiEvents.ts
│   └── useApiEvents.test.ts
│
└── core/
    ├── utils.ts
    └── utils.test.ts
```

---

## 3. Testing Stack Overview

### Tools We'll Use

| Tool | Purpose |
|------|---------|
| **Vitest** | Fast test runner (Vite-native) |
| **React Testing Library** | Component testing utilities |
| **@testing-library/user-event** | Simulate user interactions |
| **MSW (Mock Service Worker)** | API mocking |
| **@testing-library/jest-dom** | DOM assertion matchers |

### Testing Pyramid for This Project

```
                    ┌─────────────┐
                    │     E2E     │  (Playwright/Cypress)
                    │   Tests     │  Few, slow, high confidence
                   ─┴─────────────┴─
                  ┌─────────────────┐
                  │   Integration   │  API routes, page flows
                  │     Tests       │  Medium count
                 ─┴─────────────────┴─
                ┌───────────────────────┐
                │      Unit Tests       │  Components, hooks,
                │                       │  stores, schemas
               ─┴───────────────────────┴─  Many, fast
```

---

## 4. Testing Zod Schemas

Zod schemas are perfect for TDD - they define your data contracts.

### Basic Schema Test Pattern

```typescript
// src/models/booking.schema.test.ts
import { describe, it, expect } from 'vitest';
import { quickBookingSchema, contactFormSchema } from './booking.schema';

describe('quickBookingSchema', () => {
  // RED: Define what valid data should look like
  it('should accept valid booking data', () => {
    const validData = {
      serviceType: 'car-rental',
      vehicleType: 'sedan',
      preferredDate: '2025-01-15',
      phone: '+639171234567',
      source: 'hero-quick-form',
    };

    const result = quickBookingSchema.safeParse(validData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serviceType).toBe('car-rental');
    }
  });

  // Test each validation rule
  describe('serviceType validation', () => {
    it('should reject invalid service type', () => {
      const invalidData = {
        serviceType: 'invalid-service',
        phone: '+639171234567',
        preferredDate: '2025-01-15',
      };

      const result = quickBookingSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should accept all valid service types', () => {
      const validTypes = ['car-rental', 'airport-transfer', 'tour'];

      validTypes.forEach((serviceType) => {
        const result = quickBookingSchema.safeParse({
          serviceType,
          phone: '+639171234567',
          preferredDate: '2025-01-15',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('phone validation', () => {
    it('should reject phone numbers shorter than 10 characters', () => {
      const result = quickBookingSchema.safeParse({
        serviceType: 'car-rental',
        phone: '12345',
        preferredDate: '2025-01-15',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('phone');
      }
    });
  });

  describe('default values', () => {
    it('should apply default source when not provided', () => {
      const dataWithoutSource = {
        serviceType: 'tour',
        phone: '+639171234567',
        preferredDate: '2025-01-15',
      };

      const result = quickBookingSchema.safeParse(dataWithoutSource);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('hero-quick-form');
      }
    });
  });
});

describe('contactFormSchema', () => {
  const validContact = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+639171234567',
    serviceType: 'tour',
    preferredDate: '2025-01-15',
    message: 'I need a tour guide',
  };

  it('should validate complete contact form data', () => {
    const result = contactFormSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  describe('email validation', () => {
    it('should reject invalid email formats', () => {
      const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com'];

      invalidEmails.forEach((email) => {
        const result = contactFormSchema.safeParse({
          ...validContact,
          email,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('fullName validation', () => {
    it('should require minimum 2 characters', () => {
      const result = contactFormSchema.safeParse({
        ...validContact,
        fullName: 'J',
      });

      expect(result.success).toBe(false);
    });
  });
});
```

### TDD Workflow for New Schema

```typescript
// Step 1: RED - Write the test first
// src/models/vehicle.schema.test.ts
import { describe, it, expect } from 'vitest';
import { vehicleSchema } from './vehicle.schema';

describe('vehicleSchema', () => {
  it('should validate vehicle with required fields', () => {
    const vehicle = {
      type: 'sedan',
      capacity: 4,
      pricePerDay: 2500,
    };

    const result = vehicleSchema.safeParse(vehicle);
    expect(result.success).toBe(true);
  });

  it('should reject capacity less than 1', () => {
    const vehicle = {
      type: 'sedan',
      capacity: 0,
      pricePerDay: 2500,
    };

    const result = vehicleSchema.safeParse(vehicle);
    expect(result.success).toBe(false);
  });
});

// Step 2: GREEN - Create the schema to pass tests
// src/models/vehicle.schema.ts
import { z } from 'zod';

export const vehicleSchema = z.object({
  type: z.enum(['sedan', 'suv', 'van']),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  pricePerDay: z.number().positive(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

// Step 3: REFACTOR - Add more validation, keep tests green
```

---

## 5. Testing Zustand Stores

### Basic Store Test Pattern

```typescript
// src/stores/user.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from './user.store';

describe('useUserStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useUserStore.getState().clearUser();
  });

  describe('initial state', () => {
    it('should have null user initially', () => {
      const state = useUserStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and token correctly', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      };
      const mockToken = 'jwt-token-123';

      useUserStore.getState().setUser(mockUser, mockToken);
      const state = useUserStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearUser', () => {
    it('should reset all user data', () => {
      // First set a user
      useUserStore.getState().setUser(
        { id: '123', email: 'test@example.com', name: 'Test', role: 'USER' },
        'token'
      );

      // Then clear
      useUserStore.getState().clearUser();
      const state = useUserStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should partially update user data', () => {
      const initialUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      };

      useUserStore.getState().setUser(initialUser, 'token');
      useUserStore.getState().updateUser({ name: 'Updated Name' });

      const state = useUserStore.getState();

      expect(state.user?.name).toBe('Updated Name');
      expect(state.user?.email).toBe('test@example.com'); // Unchanged
    });

    it('should not update if user is null', () => {
      useUserStore.getState().updateUser({ name: 'New Name' });

      expect(useUserStore.getState().user).toBeNull();
    });
  });
});
```

### Testing Event Store

```typescript
// src/stores/event.store.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEventStore } from './event.store';

describe('useEventStore', () => {
  beforeEach(() => {
    useEventStore.getState().clearEvents();
  });

  describe('emit', () => {
    it('should add event to events array', () => {
      useEventStore.getState().emit({
        type: 'API_SUCCESS',
        status: 'success',
        message: 'Data loaded',
      });

      const events = useEventStore.getState().events;

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('API_SUCCESS');
      expect(events[0].message).toBe('Data loaded');
      expect(events[0].id).toBeDefined();
      expect(events[0].timestamp).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('should call callback when matching event is emitted', () => {
      const callback = vi.fn();

      useEventStore.getState().subscribe('API_ERROR', callback);
      useEventStore.getState().emit({
        type: 'API_ERROR',
        status: 'error',
        message: 'Failed to load',
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'API_ERROR',
          message: 'Failed to load',
        })
      );
    });

    it('should not call callback for non-matching events', () => {
      const callback = vi.fn();

      useEventStore.getState().subscribe('API_ERROR', callback);
      useEventStore.getState().emit({
        type: 'API_SUCCESS',
        status: 'success',
        message: 'Success',
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();

      const unsubscribe = useEventStore.getState().subscribe('API_ERROR', callback);
      unsubscribe();

      useEventStore.getState().emit({
        type: 'API_ERROR',
        status: 'error',
        message: 'Error',
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('removeEvent', () => {
    it('should remove specific event by id', () => {
      useEventStore.getState().emit({
        type: 'NOTIFICATION',
        status: 'info',
        message: 'First',
      });
      useEventStore.getState().emit({
        type: 'NOTIFICATION',
        status: 'info',
        message: 'Second',
      });

      const events = useEventStore.getState().events;
      const firstEventId = events[0].id;

      useEventStore.getState().removeEvent(firstEventId);

      const remainingEvents = useEventStore.getState().events;
      expect(remainingEvents).toHaveLength(1);
      expect(remainingEvents[0].message).toBe('Second');
    });
  });
});
```

### Testing Resettable Store

```typescript
// src/stores/resettable.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useResettableStore } from './resettable.store';

describe('useResettableStore', () => {
  beforeEach(() => {
    useResettableStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have default values', () => {
      const state = useResettableStore.getState();

      expect(state.search).toBe('');
      expect(state.category).toBe('');
      expect(state.sortBy).toBe('newest');
      expect(state.page).toBe(1);
    });
  });

  describe('setSearch', () => {
    it('should update search and reset page to 1', () => {
      // First go to page 3
      useResettableStore.getState().setPage(3);

      // Then search
      useResettableStore.getState().setSearch('sedan');

      const state = useResettableStore.getState();
      expect(state.search).toBe('sedan');
      expect(state.page).toBe(1); // Reset to 1
    });
  });

  describe('reset', () => {
    it('should restore all values to initial state', () => {
      // Modify all values
      useResettableStore.getState().setSearch('test');
      useResettableStore.getState().setCategory('tours');
      useResettableStore.getState().setSortBy('price');
      useResettableStore.getState().setPage(5);

      // Reset
      useResettableStore.getState().reset();

      const state = useResettableStore.getState();
      expect(state.search).toBe('');
      expect(state.category).toBe('');
      expect(state.sortBy).toBe('newest');
      expect(state.page).toBe(1);
    });
  });
});
```

---

## 6. Testing Custom Hooks

### Testing useApiEvents

```typescript
// src/hooks/useApiEvents.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiEvents, useEvents, useEventActions } from './useApiEvents';
import { useEventStore } from '@/stores/event.store';

describe('useApiEvents', () => {
  beforeEach(() => {
    useEventStore.getState().clearEvents();
  });

  it('should subscribe to events and call callback', () => {
    const callback = vi.fn();

    renderHook(() => useApiEvents('API_SUCCESS', callback));

    act(() => {
      useEventStore.getState().emit({
        type: 'API_SUCCESS',
        status: 'success',
        message: 'Test success',
      });
    });

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'API_SUCCESS',
        message: 'Test success',
      })
    );
  });

  it('should unsubscribe on unmount', () => {
    const callback = vi.fn();

    const { unmount } = renderHook(() => useApiEvents('API_ERROR', callback));
    unmount();

    act(() => {
      useEventStore.getState().emit({
        type: 'API_ERROR',
        status: 'error',
        message: 'Error',
      });
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useEvents', () => {
  it('should return events from store', () => {
    act(() => {
      useEventStore.getState().emit({
        type: 'NOTIFICATION',
        status: 'info',
        message: 'Test',
      });
    });

    const { result } = renderHook(() => useEvents());

    expect(result.current).toHaveLength(1);
    expect(result.current[0].message).toBe('Test');
  });
});

describe('useEventActions', () => {
  it('should return event action functions', () => {
    const { result } = renderHook(() => useEventActions());

    expect(typeof result.current.emit).toBe('function');
    expect(typeof result.current.clearEvents).toBe('function');
    expect(typeof result.current.removeEvent).toBe('function');
  });
});
```

### Testing Custom Hook with Dependencies

```typescript
// src/hooks/useDebounce.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Update value
    rerender({ value: 'updated' });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Rapid updates
    rerender({ value: 'update1' });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: 'update2' });
    act(() => vi.advanceTimersByTime(200));

    rerender({ value: 'update3' });

    // Still initial
    expect(result.current).toBe('initial');

    // Complete the debounce
    act(() => vi.advanceTimersByTime(500));

    // Should have final value
    expect(result.current).toBe('update3');
  });
});
```

---

## 7. Testing React Components

### Testing Utility Setup

```typescript
// src/test-utils/render.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

// Wrapper for form components
function FormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: {},
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    withForm?: boolean;
    formDefaultValues?: Record<string, unknown>;
  }
) {
  const { withForm = false, formDefaultValues, ...renderOptions } = options || {};

  if (withForm) {
    const FormWrapperWithValues = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({ defaultValues: formDefaultValues || {} });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };
    return {
      user: userEvent.setup(),
      ...render(ui, { wrapper: FormWrapperWithValues, ...renderOptions }),
    };
  }

  return {
    user: userEvent.setup(),
    ...render(ui, renderOptions),
  };
}

export * from '@testing-library/react';
export { customRender as render };
```

### Testing Server Components

```typescript
// src/components/tours/TourCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TourCard } from './TourCard';

const mockTour = {
  slug: 'cebu-city-tour',
  title: 'Cebu City Tour',
  shortDescription: 'Explore the historic sites of Cebu City',
  image: '/images/tours/cebu-city.jpg',
  duration: '8 hours',
  featured: true,
  pricing: {
    sedan: 3500,
    suv: 4500,
    van: 6000,
  },
};

describe('TourCard', () => {
  it('should render tour title', () => {
    render(<TourCard tour={mockTour} />);

    expect(screen.getByText('Cebu City Tour')).toBeInTheDocument();
  });

  it('should render tour description', () => {
    render(<TourCard tour={mockTour} />);

    expect(screen.getByText(/Explore the historic sites/)).toBeInTheDocument();
  });

  it('should render duration', () => {
    render(<TourCard tour={mockTour} />);

    expect(screen.getByText('8 hours')).toBeInTheDocument();
  });

  it('should render starting price', () => {
    render(<TourCard tour={mockTour} />);

    // Assuming it shows the lowest price (sedan)
    expect(screen.getByText(/3,500|₱3500/)).toBeInTheDocument();
  });

  it('should link to tour details page', () => {
    render(<TourCard tour={mockTour} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tours/cebu-city-tour');
  });

  it('should show featured badge when tour is featured', () => {
    render(<TourCard tour={mockTour} />);

    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it('should not show featured badge when tour is not featured', () => {
    render(<TourCard tour={{ ...mockTour, featured: false }} />);

    expect(screen.queryByText(/featured/i)).not.toBeInTheDocument();
  });
});
```

### Testing Client Components

```typescript
// src/components/landing/Navigation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { Navigation } from './Navigation';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Navigation', () => {
  it('should render logo', () => {
    render(<Navigation />);

    expect(screen.getByAltText(/easyrides|logo/i)).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Navigation />);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tours/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
  });

  it('should toggle mobile menu on hamburger click', async () => {
    const { user } = render(<Navigation />);

    // Mobile menu should be hidden initially
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toHaveClass('hidden');

    // Click hamburger
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);

    // Mobile menu should be visible
    expect(mobileMenu).not.toHaveClass('hidden');
  });

  it('should close mobile menu when link is clicked', async () => {
    const { user } = render(<Navigation />);

    // Open mobile menu
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);

    // Click a link in mobile menu
    const toursLink = screen.getAllByRole('link', { name: /tours/i })[1]; // Mobile version
    await user.click(toursLink);

    // Menu should close
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).toHaveClass('hidden');
  });
});
```

---

## 8. Testing Form Components

### Testing FormInput Component

```typescript
// src/components/FormInput.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { FormInput } from './FormInput';

describe('FormInput', () => {
  it('should render label when showLabel is true', () => {
    render(
      <FormInput name="email" label="Email Address" showLabel />,
      { withForm: true }
    );

    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('should not render label when showLabel is false', () => {
    render(
      <FormInput name="email" label="Email Address" showLabel={false} />,
      { withForm: true }
    );

    expect(screen.queryByText('Email Address')).not.toBeInTheDocument();
  });

  it('should show required indicator when showRequired is true', () => {
    render(
      <FormInput name="email" label="Email" showLabel showRequired />,
      { withForm: true }
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should render placeholder text', () => {
    render(
      <FormInput name="email" placeholder="Enter your email" />,
      { withForm: true }
    );

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <FormInput name="email" disabled />,
      { withForm: true }
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should update value on user input', async () => {
    const { user } = render(
      <FormInput name="email" />,
      { withForm: true }
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  it('should apply correct type attribute', () => {
    render(
      <FormInput name="password" type="password" />,
      { withForm: true }
    );

    expect(screen.getByRole('textbox', { hidden: true })).toHaveAttribute('type', 'password');
  });
});
```

### Testing Complete Form with Validation

```typescript
// src/components/tours/TourInquiryForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils/render';
import { TourInquiryForm } from './TourInquiryForm';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TourInquiryForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should render all form fields', () => {
    render(<TourInquiryForm tourName="Cebu City Tour" />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it('should pre-fill message with tour name', () => {
    render(<TourInquiryForm tourName="Cebu City Tour" />);

    const messageField = screen.getByLabelText(/message/i);
    expect(messageField).toHaveValue(expect.stringContaining('Cebu City Tour'));
  });

  it('should show validation errors for empty required fields', async () => {
    const { user } = render(<TourInquiryForm tourName="Test Tour" />);

    // Submit without filling fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    const { user } = render(<TourInquiryForm tourName="Test Tour" />);

    // Fill with invalid email
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'notanemail');
    await user.type(screen.getByLabelText(/phone/i), '+639171234567');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const onSuccess = vi.fn();
    const { user } = render(
      <TourInquiryForm tourName="Test Tour" onSuccess={onSuccess} />
    );

    // Fill form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+639171234567');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/submit-booking',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('john@example.com'),
        })
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show success message after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { user } = render(<TourInquiryForm tourName="Test Tour" />);

    // Fill and submit
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+639171234567');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  it('should show error message on submission failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { user } = render(<TourInquiryForm tourName="Test Tour" />);

    // Fill and submit
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+639171234567');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/wrong|error|try again/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { user } = render(<TourInquiryForm tourName="Test Tour" />);

    // Fill form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+639171234567');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/submitting/i);
    });
  });
});
```

---

## 9. Testing API Routes

### Using MSW for API Mocking

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/submit-booking', async ({ request }) => {
    const body = await request.json();

    // Simulate validation
    if (!body.email || !body.phone) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Booking submitted successfully',
    });
  }),
];
```

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// vitest.setup.ts (updated)
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, afterAll, beforeAll } from 'vitest';
import { server } from './src/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

### Testing API Route Handlers Directly

```typescript
// src/app/api/submit-booking/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock Google Sheets API
vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({
        getClient: vi.fn(),
      })),
    },
    sheets: vi.fn().mockReturnValue({
      spreadsheets: {
        values: {
          append: vi.fn().mockResolvedValue({ data: {} }),
        },
      },
    }),
  },
}));

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/submit-booking', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('POST /api/submit-booking', () => {
  describe('validation', () => {
    it('should return 400 for missing required fields', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        // Missing other required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        fullName: 'John Doe',
        email: 'not-an-email',
        phone: '+639171234567',
        serviceType: 'tour',
        preferredDate: '2025-01-15',
        addDriver: true,
        source: 'test',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid service type', async () => {
      const request = createMockRequest({
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+639171234567',
        serviceType: 'invalid-type',
        preferredDate: '2025-01-15',
        addDriver: true,
        source: 'test',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('successful submission', () => {
    it('should return success for valid data', async () => {
      const request = createMockRequest({
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+639171234567',
        serviceType: 'tour',
        preferredDate: '2025-01-15',
        vehicleType: 'sedan',
        message: 'Test message',
        addDriver: true,
        source: 'test',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/submit-booking', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
```

---

## 10. Testing Utilities

### Testing Helper Functions

```typescript
// src/core/utils.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  formatDate,
  truncate,
  debounce,
  generateId,
  formatCurrency,
} from './utils';

describe('formatDate', () => {
  it('should format date in default format', () => {
    const date = new Date('2025-01-15');
    const result = formatDate(date);

    expect(result).toBe('January 15, 2025'); // or your expected format
  });

  it('should handle string date input', () => {
    const result = formatDate('2025-01-15');

    expect(result).toContain('2025');
    expect(result).toContain('15');
  });

  it('should return empty string for invalid date', () => {
    const result = formatDate('invalid-date');

    expect(result).toBe('');
  });
});

describe('truncate', () => {
  it('should truncate long strings', () => {
    const result = truncate('This is a very long string that needs truncating', 20);

    expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(result).toContain('...');
  });

  it('should not truncate short strings', () => {
    const result = truncate('Short', 20);

    expect(result).toBe('Short');
  });

  it('should handle empty string', () => {
    const result = truncate('', 10);

    expect(result).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should only call once for rapid invocations', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 500);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('generateId', () => {
  it('should generate unique ids', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
  });

  it('should generate string ids', () => {
    const id = generateId();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('formatCurrency', () => {
  it('should format number as PHP currency', () => {
    const result = formatCurrency(3500);

    expect(result).toMatch(/₱|PHP/);
    expect(result).toContain('3,500');
  });

  it('should handle decimal values', () => {
    const result = formatCurrency(3500.50);

    expect(result).toContain('3,500');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);

    expect(result).toContain('0');
  });
});
```

---

## 11. Integration Testing

### Testing Page Flows

```typescript
// src/__tests__/flows/booking-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from '@/components/landing/HeroSection';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Booking Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset to default handlers
    server.resetHandlers();
  });

  it('should complete quick booking flow successfully', async () => {
    render(<HeroSection />);

    // 1. Select service type
    const serviceSelect = screen.getByLabelText(/service type/i);
    await user.click(serviceSelect);
    await user.click(screen.getByText(/airport transfer/i));

    // 2. Enter phone number
    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '+639171234567');

    // 3. Select date
    const dateInput = screen.getByLabelText(/date/i);
    await user.click(dateInput);
    // Select a date from calendar
    await user.click(screen.getByText('15'));

    // 4. Submit
    const submitButton = screen.getByRole('button', { name: /book|submit/i });
    await user.click(submitButton);

    // 5. Verify success
    await waitFor(() => {
      expect(screen.getByText(/success|received|contact/i)).toBeInTheDocument();
    });
  });

  it('should show error when API fails', async () => {
    // Override handler for this test
    server.use(
      http.post('/api/submit-booking', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 500 }
        );
      })
    );

    render(<HeroSection />);

    // Fill form
    await user.type(screen.getByLabelText(/phone/i), '+639171234567');

    // Submit
    await user.click(screen.getByRole('button', { name: /book|submit/i }));

    // Verify error
    await waitFor(() => {
      expect(screen.getByText(/error|failed|try again/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Page Components

```typescript
// src/__tests__/pages/tours.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToursPage from '@/app/tours/page';

describe('Tours Page', () => {
  it('should render page title', () => {
    render(<ToursPage />);

    expect(screen.getByRole('heading', { name: /tours/i })).toBeInTheDocument();
  });

  it('should render tour cards', () => {
    render(<ToursPage />);

    // Check for tour cards
    const tourCards = screen.getAllByTestId('tour-card');
    expect(tourCards.length).toBeGreaterThan(0);
  });

  it('should display featured tours first', () => {
    render(<ToursPage />);

    const tourCards = screen.getAllByTestId('tour-card');
    const firstCard = tourCards[0];

    expect(firstCard).toHaveTextContent(/featured/i);
  });
});
```

---

## 12. Best Practices & Patterns

### Test Organization

```typescript
describe('ComponentName', () => {
  // Group by functionality
  describe('rendering', () => {
    it('should render correctly with default props', () => {});
    it('should render correctly with custom props', () => {});
  });

  describe('user interactions', () => {
    it('should handle click events', () => {});
    it('should handle input changes', () => {});
  });

  describe('validation', () => {
    it('should show error for invalid input', () => {});
    it('should clear error when input becomes valid', () => {});
  });

  describe('API integration', () => {
    it('should handle successful response', () => {});
    it('should handle error response', () => {});
  });

  describe('edge cases', () => {
    it('should handle empty data', () => {});
    it('should handle loading state', () => {});
  });
});
```

### Naming Conventions

```typescript
// Test file naming
ComponentName.test.tsx       // Component tests
componentName.test.ts        // Function/module tests
useHookName.test.ts          // Hook tests
feature-name.test.ts         // Feature/integration tests

// Test case naming - use "should" format
it('should render the submit button', () => {});
it('should disable button when form is invalid', () => {});
it('should call onSubmit when form is submitted', () => {});
it('should display error message for invalid email', () => {});
```

### Arrange-Act-Assert Pattern

```typescript
it('should update user name in store', () => {
  // Arrange - Set up test data and conditions
  const mockUser = { id: '1', name: 'John', email: 'john@example.com', role: 'USER' };
  useUserStore.getState().setUser(mockUser, 'token');

  // Act - Perform the action being tested
  useUserStore.getState().updateUser({ name: 'Jane' });

  // Assert - Verify the expected outcome
  const state = useUserStore.getState();
  expect(state.user?.name).toBe('Jane');
});
```

### Test Data Factories

```typescript
// src/test-utils/factories.ts
import { faker } from '@faker-js/faker';

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: 'USER',
  ...overrides,
});

export const createMockTour = (overrides = {}) => ({
  slug: faker.helpers.slugify(faker.commerce.productName()),
  title: faker.commerce.productName(),
  shortDescription: faker.commerce.productDescription(),
  image: faker.image.url(),
  duration: `${faker.number.int({ min: 4, max: 12 })} hours`,
  featured: faker.datatype.boolean(),
  pricing: {
    sedan: faker.number.int({ min: 2000, max: 4000 }),
    suv: faker.number.int({ min: 3000, max: 5000 }),
    van: faker.number.int({ min: 5000, max: 8000 }),
  },
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  phone: '+639171234567',
  serviceType: faker.helpers.arrayElement(['car-rental', 'airport-transfer', 'tour']),
  preferredDate: faker.date.future().toISOString().split('T')[0],
  vehicleType: faker.helpers.arrayElement(['sedan', 'suv', 'van']),
  message: faker.lorem.sentence(),
  addDriver: faker.datatype.boolean(),
  source: 'test',
  ...overrides,
});
```

### Custom Matchers

```typescript
// src/test-utils/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },

  toBePhilippinePhoneNumber(received: string) {
    const phoneRegex = /^\+63[0-9]{10}$/;
    const pass = phoneRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a Philippine phone number`
          : `expected ${received} to be a Philippine phone number`,
    };
  },
});

// Usage
expect('test@example.com').toBeValidEmail();
expect('+639171234567').toBePhilippinePhoneNumber();
```

---

## 13. Common Pitfalls

### 1. Testing Implementation Details

```typescript
// ❌ BAD - Testing internal state
it('should set isOpen to true', () => {
  render(<Modal />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(component.state.isOpen).toBe(true); // Testing internal state
});

// ✅ GOOD - Testing behavior/output
it('should display modal content when opened', async () => {
  const { user } = render(<Modal />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### 2. Not Waiting for Async Operations

```typescript
// ❌ BAD - Not waiting for async
it('should show success message', async () => {
  const { user } = render(<Form />);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect(screen.getByText('Success')).toBeInTheDocument(); // May fail
});

// ✅ GOOD - Using waitFor
it('should show success message', async () => {
  const { user } = render(<Form />);
  await user.click(screen.getByRole('button', { name: /submit/i }));
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### 3. Over-mocking

```typescript
// ❌ BAD - Mocking everything
vi.mock('@/components/FormInput', () => ({
  FormInput: () => <input />,
}));

// ✅ GOOD - Only mock what's necessary (external dependencies)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
```

### 4. Flaky Tests with Timing

```typescript
// ❌ BAD - Using fixed timeouts
it('should debounce input', async () => {
  const { user } = render(<SearchInput />);
  await user.type(screen.getByRole('textbox'), 'test');
  await new Promise(resolve => setTimeout(resolve, 600));
  expect(onSearch).toHaveBeenCalled();
});

// ✅ GOOD - Using fake timers
it('should debounce input', async () => {
  vi.useFakeTimers();
  const { user } = render(<SearchInput />);

  await user.type(screen.getByRole('textbox'), 'test');

  act(() => {
    vi.advanceTimersByTime(500);
  });

  expect(onSearch).toHaveBeenCalledWith('test');
  vi.useRealTimers();
});
```

### 5. Not Resetting State Between Tests

```typescript
// ❌ BAD - State leaks between tests
describe('UserStore', () => {
  it('should set user', () => {
    useUserStore.getState().setUser(mockUser, 'token');
    expect(useUserStore.getState().user).toEqual(mockUser);
  });

  it('should have no user initially', () => {
    // This fails because previous test set a user!
    expect(useUserStore.getState().user).toBeNull();
  });
});

// ✅ GOOD - Reset in beforeEach
describe('UserStore', () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
  });

  // Tests are now isolated
});
```

### 6. Testing Third-Party Libraries

```typescript
// ❌ BAD - Testing PrimeReact internals
it('should call PrimeReact Calendar onChange', () => {
  // Don't test library behavior
});

// ✅ GOOD - Test your component's behavior
it('should update form when date is selected', async () => {
  render(<FormCalendar name="date" />, { withForm: true });
  // Test that your component handles the value correctly
});
```

---

## 14. TDD Workflow Examples

### Example 1: Adding a New Validation Rule

```typescript
// Step 1: RED - Write the failing test
// src/models/booking.schema.test.ts
describe('booking date validation', () => {
  it('should reject dates in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = bookingSchema.safeParse({
      ...validBooking,
      preferredDate: yesterday.toISOString().split('T')[0],
    });

    expect(result.success).toBe(false);
  });
});

// Step 2: GREEN - Add the validation
// src/models/booking.schema.ts
export const bookingSchema = z.object({
  // ... other fields
  preferredDate: z.string().refine((date) => {
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  }, 'Date must be today or in the future'),
});

// Step 3: REFACTOR - Extract helper if needed
const isFutureDate = (dateString: string): boolean => {
  const selected = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected >= today;
};

export const bookingSchema = z.object({
  preferredDate: z.string().refine(isFutureDate, 'Date must be today or in the future'),
});
```

### Example 2: Adding a New Component

```typescript
// Step 1: RED - Write tests first
// src/components/PriceTag.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceTag } from './PriceTag';

describe('PriceTag', () => {
  it('should render price with currency symbol', () => {
    render(<PriceTag amount={3500} />);
    expect(screen.getByText(/₱3,500/)).toBeInTheDocument();
  });

  it('should show discount when originalPrice is provided', () => {
    render(<PriceTag amount={3500} originalPrice={5000} />);
    expect(screen.getByText(/₱5,000/)).toHaveClass('line-through');
  });

  it('should calculate and show percentage discount', () => {
    render(<PriceTag amount={3500} originalPrice={5000} />);
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });
});

// Step 2: GREEN - Implement component
// src/components/PriceTag.tsx
interface PriceTagProps {
  amount: number;
  originalPrice?: number;
}

export function PriceTag({ amount, originalPrice }: PriceTagProps) {
  const formatPrice = (price: number) => `₱${price.toLocaleString()}`;

  const discountPercent = originalPrice
    ? Math.round((1 - amount / originalPrice) * 100)
    : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-coral">
        {formatPrice(amount)}
      </span>
      {originalPrice && (
        <>
          <span className="text-sm text-slate-400 line-through">
            {formatPrice(originalPrice)}
          </span>
          <span className="text-sm text-green-600 font-medium">
            {discountPercent}% off
          </span>
        </>
      )}
    </div>
  );
}

// Step 3: REFACTOR - Improve styling, add to barrel export
```

### Example 3: Adding a New API Endpoint

```typescript
// Step 1: RED - Write API tests
// src/app/api/tours/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/tours', () => {
  it('should return all tours', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.tours)).toBe(true);
    expect(data.tours.length).toBeGreaterThan(0);
  });

  it('should filter by featured when query param is provided', async () => {
    const request = new Request('http://localhost/api/tours?featured=true');
    const response = await GET(request);
    const data = await response.json();

    expect(data.tours.every((t: { featured: boolean }) => t.featured)).toBe(true);
  });
});

// Step 2: GREEN - Implement endpoint
// src/app/api/tours/route.ts
import { NextResponse } from 'next/server';
import toursData from '@/data/tours.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get('featured');

  let tours = toursData;

  if (featured === 'true') {
    tours = tours.filter(t => t.featured);
  }

  return NextResponse.json({ tours });
}

// Step 3: REFACTOR - Add pagination, sorting, etc.
```

---

## Quick Reference Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/components/FormInput.test.tsx

# Run tests matching pattern
npm test -- --grep "should validate"

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Update snapshots
npm test -- -u
```

---

## Summary

| What to Test | Tools | Priority |
|--------------|-------|----------|
| Zod Schemas | Vitest | High |
| Zustand Stores | Vitest | High |
| Custom Hooks | RTL + Vitest | High |
| Form Components | RTL + user-event | High |
| UI Components | RTL | Medium |
| API Routes | Vitest + MSW | Medium |
| Page Flows | RTL + MSW | Medium |
| Utilities | Vitest | Low |

Remember the TDD cycle:
1. **RED** - Write a failing test
2. **GREEN** - Write minimal code to pass
3. **REFACTOR** - Improve while keeping tests green

Start small, build confidence, and incrementally add more tests as you develop new features!
