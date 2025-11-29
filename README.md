# EasyRides App

A Next.js 15 application with enterprise-grade architecture, featuring modular design, type-safe forms, state management, and API integration.

## 🏗️ Architecture

This application follows a **feature-based modular architecture** with clear separation of concerns:

```
src/
├── app/              # Next.js App Router (pages & routing)
├── assets/           # Static resources (images, fonts, etc.)
├── components/       # Shared UI components
├── core/            # Utilities, constants, and configuration
├── guards/          # Route protection logic
├── hooks/           # Custom React hooks
├── layouts/         # Page layout templates
├── models/          # TypeScript types and interfaces
├── modules/         # Feature-based modules
├── services/        # API client and business logic
└── stores/          # Zustand state management
```

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Validation**: Zod + react-hook-form
- **HTTP Client**: Native Fetch API with custom wrapper
- **Build Tool**: Next.js default (Turbopack/Webpack)

## 📦 Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your configuration.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏛️ Core Concepts

### State Management (Zustand)

Three store patterns are implemented:

#### 1. **Basic Store with Persistence**
```typescript
import { useUserStore } from '@/stores/user.store';

const { user, setUser, clearUser } = useUserStore();
```

#### 2. **Resettable Store**
```typescript
import { useResettableStore } from '@/stores/resettable.store';

const { filters, setFilters, reset } = useResettableStore();
```

#### 3. **Event Store (Pub-Sub)**
```typescript
import { useEventStore } from '@/stores/event.store';

const { emit, subscribe } = useEventStore();
```

### API Client

Centralized API client with interceptors and token management:

```typescript
import { apiClient } from '@/services/api-client';

// GET request
const response = await apiClient.get<User[]>('/users');

// POST request
const newUser = await apiClient.post<User>('/users', { name, email });
```

Features:
- Automatic token injection
- Request/response interceptors
- Error handling with event emissions
- JWT token refresh logic

### Form Validation

Type-safe forms using Zod and react-hook-form:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/models/validation-schemas';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

Pre-built form components:
- `FormInput` - Text input with error display
- `FormTextarea` - Textarea with validation
- `FormSelect` - Select dropdown with options

### Route Guards

#### Server-side (Middleware)
```typescript
// src/middleware.ts
// Automatically protects routes defined in protectedRoutes array
```

#### Client-side (Component)
```typescript
import { AuthGuard } from '@/guards';

<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

## 📁 Feature Modules

Create feature modules following this structure:

```
modules/
└── feature-name/
    ├── components/     # Feature-specific components
    ├── hooks/         # Feature-specific hooks
    ├── services/      # Feature-specific API services
    └── index.ts       # Module exports
```

### Example Usage:

```typescript
// Import from a feature module
import { ExampleCard } from '@/modules/example-feature';

export default function Page() {
  return <ExampleCard id="123" />;
}
```

## 🎨 Layouts

Two layout templates are provided:

### MainLayout
For authenticated pages with header, navigation, and footer:

```typescript
import { MainLayout } from '@/layouts';

export default function DashboardPage() {
  return (
    <MainLayout>
      <h1>Dashboard</h1>
    </MainLayout>
  );
}
```

### AuthLayout
For authentication pages (login, register):

```typescript
import { AuthLayout } from '@/layouts';

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back">
      <LoginForm />
    </AuthLayout>
  );
}
```

## 🛠️ Configuration

### Environment Variables

Configure in `.env.local`:

```env
NEXT_PUBLIC_APP_NAME=EasyRides App
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Type-safe Config

Access configuration throughout the app:

```typescript
import { config } from '@/core/config';

console.log(config.api.url);  // Type-safe access
```

## 🧰 Utilities

Common utilities in `src/core/utils.ts`:

```typescript
import { formatDate, truncate, debounce, generateId } from '@/core/utils';

const formatted = formatDate(new Date());
const short = truncate('Long text here', 20);
const debouncedFn = debounce(myFunction, 300);
const id = generateId('user');
```

## 📝 TypeScript Path Aliases

Import using clean aliases:

```typescript
import { Button } from '@/components';
import { config } from '@/core';
import { AuthGuard } from '@/guards';
import { useApiEvents } from '@/hooks';
import { User } from '@/models';
import { ExampleCard } from '@/modules/example-feature';
import { apiClient } from '@/services';
import { useUserStore } from '@/stores';
```

## 🔒 Authentication Flow

1. User logs in via login form
2. API client receives auth tokens
3. Tokens stored in Zustand user store (persisted to localStorage)
4. Middleware checks auth on protected routes
5. API client automatically injects token in requests
6. On 401 error, user is cleared and redirected to login

## 📚 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🎯 Best Practices

1. **Feature Modules**: Organize code by feature, not by file type
2. **Type Safety**: Use TypeScript interfaces for all data structures
3. **Validation**: Define Zod schemas for all forms
4. **State Management**: Use appropriate store pattern (basic/resettable/event)
5. **API Integration**: Use the API client wrapper, not raw fetch
6. **Components**: Keep components small and focused
7. **Exports**: Use barrel exports (index.ts) in each directory

## 🔄 Creating a New Feature

1. Create a new directory in `src/modules/`:
   ```bash
   mkdir -p src/modules/my-feature/{components,hooks,services}
   ```

2. Add your components, hooks, and services

3. Create an `index.ts` to export public APIs

4. Create pages in `src/app/` that use your module:
   ```typescript
   import { MyComponent } from '@/modules/my-feature';
   ```

## 🐛 Debugging

Enable debug mode in `.env.local`:

```env
NEXT_PUBLIC_ENABLE_DEBUG=true
```

Monitor API events:

```typescript
import { useApiEvents } from '@/hooks';

useApiEvents('API_ERROR', (event) => {
  console.error('API Error:', event);
});
```

## 📄 License

MIT

## 🤝 Contributing

This is a template/boilerplate. Customize it for your specific needs!

---

Built with ❤️ using Next.js 15, TypeScript, Zustand, and Zod
