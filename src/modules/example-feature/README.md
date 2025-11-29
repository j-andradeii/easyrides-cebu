# Example Feature Module

This is a template for creating feature modules in the application.

## Structure

```
example-feature/
├── README.md           # Module documentation
├── index.ts            # Module exports
├── components/         # Feature-specific components
│   └── ExampleCard.tsx
├── hooks/             # Feature-specific custom hooks
│   └── useExampleData.ts
└── services/          # Feature-specific API services
    └── example.service.ts
```

## Usage

### In Next.js App Router

Feature modules are used within the App Router pages:

```tsx
// app/example/page.tsx
import { ExampleCard } from '@/modules/example-feature';

export default function ExamplePage() {
  return (
    <div>
      <ExampleCard />
    </div>
  );
}
```

### Module Components

Components specific to this feature:

```tsx
import { ExampleCard } from '@/modules/example-feature/components/ExampleCard';
```

### Module Hooks

Custom hooks for this feature:

```tsx
import { useExampleData } from '@/modules/example-feature/hooks/useExampleData';
```

### Module Services

API services for this feature:

```tsx
import { exampleService } from '@/modules/example-feature/services/example.service';
```

## Creating a New Feature Module

1. Copy this template directory
2. Rename to your feature name (e.g., `products`, `users`, `orders`)
3. Update the exports in `index.ts`
4. Create your feature-specific components, hooks, and services
5. Create corresponding pages in `src/app/[your-feature]/page.tsx`
