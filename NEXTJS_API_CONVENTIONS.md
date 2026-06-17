# Next.js API Conventions (App Router)

This document outlines the standard conventions for building API endpoints using the Next.js App Router.

## 1. File Structure & Routing

API routes are defined in `route.ts` (or `route.js`) files within the `src/app` directory. Next.js maps the file path directly to the URL.

- **Standard Route**:
  - File: `src/app/api/users/route.ts`
  - URL: `/api/users`

- **Dynamic Route**:
  - File: `src/app/api/users/[id]/route.ts`
  - URL: `/api/users/123`
  - Accessing ID: Via the `params` argument.

- **Catch-all Route**:
  - File: `src/app/api/docs/[...slug]/route.ts`
  - URL: `/api/docs/a/b/c`

## 2. HTTP Methods

Export async functions named after the HTTP verbs you want to support.

```typescript
export async function GET(request: Request) {}
export async function POST(request: Request) {}
export async function PUT(request: Request) {}
export async function PATCH(request: Request) {}
export async function DELETE(request: Request) {}
export async function HEAD(request: Request) {}
export async function OPTIONS(request: Request) {}
```

**Note**: You cannot export `default`.

## 3. Basic Request & Response

Next.js uses the standard Web API `Request` and `Response` objects, extended by `NextRequest` and `NextResponse`.

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello World' }, { status: 200 });
}
```

## 4. Handling Dynamic Routes (Params)

The second argument to the handler function contains the dynamic route parameters.

```typescript
// File: src/app/api/users/[id]/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } } // Type params according to your folder name
) {
  const userId = params.id;
  return NextResponse.json({ userId });
}
```

## 5. Reading Request Body (POST/PUT)

Use standard methods to parse the body.

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json(); // For JSON
    // const formData = await request.formData(); // For Form Data
    
    return NextResponse.json({ received: body });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid Body' }, { status: 400 });
  }
}
```

## 6. Accessing Query Parameters

Use the `nextUrl` property from `request` (if typing as `NextRequest`) or create a URL object.

```typescript
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query'); // /api/search?query=hello
  
  return NextResponse.json({ query });
}
```

## 7. Headers & Cookies

```typescript
import { cookies, headers } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  
  const headersList = headers();
  const referer = headersList.get('referer');

  return NextResponse.json({ token, referer });
}
```

## 8. Caching Behavior

By default, `GET` requests are cached. 
To opt out, use dynamic forcing or rely on the `Request` object which automatically opts out if access methods like `headers()` or `cookies()` are used, or generally if it's dynamic.

```typescript
// Force dynamic (no caching)
export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) { ... }
```
