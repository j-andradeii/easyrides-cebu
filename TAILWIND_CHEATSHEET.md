# Tailwind CSS Cheatsheet for Next.js

A comprehensive guide from basic to advanced, with practical examples and "when to use what" guidance.

---

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Layout & Positioning](#layout--positioning)
3. [Flexbox](#flexbox)
4. [Grid](#grid)
5. [Spacing (Margin & Padding)](#spacing-margin--padding)
6. [Sizing (Width & Height)](#sizing-width--height)
7. [Typography](#typography)
8. [Colors & Backgrounds](#colors--backgrounds)
9. [Borders & Rounded Corners](#borders--rounded-corners)
10. [Shadows & Effects](#shadows--effects)
11. [Responsive Design](#responsive-design)
12. [States & Pseudo-classes](#states--pseudo-classes)
13. [Animations & Transitions](#animations--transitions)
14. [Dark Mode](#dark-mode)
15. [Common Component Patterns](#common-component-patterns)
16. [Performance Tips for Next.js](#performance-tips-for-nextjs)
17. [Advanced Techniques](#advanced-techniques)

---

## Setup & Configuration

### Next.js + Tailwind (App Router)

```bash
# Already set up, but for reference:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### tailwind.config.ts (Next.js App Router)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
}
export default config
```

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Custom components */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
  }
}
```

---

## Layout & Positioning

### Display

| Class | CSS | When to Use |
|-------|-----|-------------|
| `block` | `display: block` | Default for divs, force inline elements to be block |
| `inline-block` | `display: inline-block` | Inline but with width/height control |
| `inline` | `display: inline` | Flows with text |
| `flex` | `display: flex` | **Most common** - Row/column layouts |
| `grid` | `display: grid` | Complex 2D layouts, cards, galleries |
| `hidden` | `display: none` | Conditionally hide elements |
| `contents` | `display: contents` | Remove wrapper but keep children |

### Position

| Class | CSS | When to Use |
|-------|-----|-------------|
| `static` | `position: static` | Default, normal flow |
| `relative` | `position: relative` | **Parent for absolute children**, small offsets |
| `absolute` | `position: absolute` | Overlays, badges, floating elements |
| `fixed` | `position: fixed` | Sticky headers, modals, floating buttons |
| `sticky` | `position: sticky` | Headers that stick on scroll |

### Position Values

```jsx
// Absolute positioning
<div className="relative">
  <span className="absolute top-0 right-0">Badge</span>
  <span className="absolute bottom-2 left-2">Caption</span>
  <span className="absolute inset-0">Full overlay</span>
  <span className="absolute inset-x-0 bottom-0">Bottom bar</span>
  <span className="absolute inset-y-0 left-0">Left sidebar</span>
</div>
```

| Class | Effect |
|-------|--------|
| `top-0` | Top: 0 |
| `right-0` | Right: 0 |
| `bottom-0` | Bottom: 0 |
| `left-0` | Left: 0 |
| `inset-0` | All sides: 0 (full coverage) |
| `inset-x-0` | Left & Right: 0 |
| `inset-y-0` | Top & Bottom: 0 |
| `top-1/2` | Top: 50% |
| `-translate-y-1/2` | Center vertically (use with top-1/2) |

### Z-Index

| Class | Value | When to Use |
|-------|-------|-------------|
| `z-0` | 0 | Base layer |
| `z-10` | 10 | Slightly elevated |
| `z-20` | 20 | Dropdowns |
| `z-30` | 30 | Fixed headers |
| `z-40` | 40 | Modals backdrop |
| `z-50` | 50 | Modals, dialogs |
| `z-auto` | auto | Default stacking |

---

## Flexbox

### Container

```jsx
<div className="flex">           {/* Row (default) */}
<div className="flex flex-col">  {/* Column */}
<div className="flex flex-row-reverse">  {/* Row RTL */}
<div className="flex flex-col-reverse">  {/* Column bottom-up */}
```

### Justify Content (Main Axis)

| Class | Effect | When to Use |
|-------|--------|-------------|
| `justify-start` | Items at start | Default |
| `justify-center` | Items centered | Center horizontally |
| `justify-end` | Items at end | Right-align items |
| `justify-between` | Space between | **Nav items, footer links** |
| `justify-around` | Space around | Equal spacing with edges |
| `justify-evenly` | Even space | Perfect equal spacing |

### Align Items (Cross Axis)

| Class | Effect | When to Use |
|-------|--------|-------------|
| `items-start` | Top align | Default for flex-col |
| `items-center` | Center align | **Most common - vertical center** |
| `items-end` | Bottom align | Footer items |
| `items-baseline` | Text baseline | Mixed font sizes |
| `items-stretch` | Stretch to fill | Equal height cards |

### Common Flex Patterns

```jsx
// Centered content (horizontal + vertical)
<div className="flex items-center justify-center h-screen">
  <p>Perfectly centered</p>
</div>

// Navigation bar
<nav className="flex items-center justify-between px-6 py-4">
  <Logo />
  <div className="flex items-center gap-4">
    <Link>Home</Link>
    <Link>About</Link>
  </div>
</nav>

// Card with footer at bottom
<div className="flex flex-col h-full">
  <div className="flex-1">Content</div>
  <footer>Always at bottom</footer>
</div>

// Sidebar layout
<div className="flex h-screen">
  <aside className="w-64 shrink-0">Sidebar</aside>
  <main className="flex-1 overflow-auto">Content</main>
</div>
```

### Flex Item Properties

| Class | Effect | When to Use |
|-------|--------|-------------|
| `flex-1` | Grow to fill space | Main content area |
| `flex-auto` | Grow/shrink based on content | Responsive items |
| `flex-initial` | Shrink but don't grow | Buttons, icons |
| `flex-none` | Don't grow or shrink | Fixed-size items |
| `grow` | Allow growing | Fill remaining space |
| `grow-0` | Prevent growing | Keep natural size |
| `shrink` | Allow shrinking | Responsive text |
| `shrink-0` | Prevent shrinking | **Icons, fixed elements** |

### Gap (Spacing between flex/grid items)

| Class | Size | Pixels |
|-------|------|--------|
| `gap-0` | 0 | 0px |
| `gap-1` | 0.25rem | 4px |
| `gap-2` | 0.5rem | 8px |
| `gap-3` | 0.75rem | 12px |
| `gap-4` | 1rem | 16px |
| `gap-6` | 1.5rem | 24px |
| `gap-8` | 2rem | 32px |
| `gap-x-4` | Horizontal only | 16px |
| `gap-y-4` | Vertical only | 16px |

---

## Grid

### Basic Grid

```jsx
// Equal columns
<div className="grid grid-cols-2">      {/* 2 columns */}
<div className="grid grid-cols-3">      {/* 3 columns */}
<div className="grid grid-cols-4">      {/* 4 columns */}

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>

// Auto-fit (responsive without breakpoints)
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Grid Template Columns

| Class | Effect |
|-------|--------|
| `grid-cols-1` | 1 column |
| `grid-cols-2` | 2 equal columns |
| `grid-cols-3` | 3 equal columns |
| `grid-cols-4` | 4 equal columns |
| `grid-cols-6` | 6 equal columns |
| `grid-cols-12` | 12-column grid (Bootstrap-like) |
| `grid-cols-none` | No columns defined |
| `grid-cols-subgrid` | Use parent grid |

### Grid Span (How many columns an item takes)

```jsx
// 12-column grid layout
<div className="grid grid-cols-12 gap-4">
  <aside className="col-span-3">Sidebar</aside>
  <main className="col-span-9">Content</main>
</div>

// Spanning columns
<div className="col-span-2">    {/* Takes 2 columns */}
<div className="col-span-full"> {/* Takes all columns */}
<div className="col-start-2">   {/* Starts at column 2 */}
<div className="col-end-4">     {/* Ends at column 4 */}
```

### Grid Rows

```jsx
<div className="grid grid-rows-3 gap-4">
  <div className="row-span-2">Tall item</div>
  <div>Normal</div>
</div>
```

### When to Use Grid vs Flexbox

| Use Grid | Use Flexbox |
|----------|-------------|
| 2D layouts (rows AND columns) | 1D layouts (row OR column) |
| Card grids | Navigation bars |
| Complex page layouts | Centering content |
| Magazine-style layouts | Simple stacking |
| When you need explicit tracks | When content size varies |

---

## Spacing (Margin & Padding)

### The Spacing Scale

| Size | rem | Pixels | Use Case |
|------|-----|--------|----------|
| 0 | 0 | 0px | Reset |
| px | 1px | 1px | Hairline |
| 0.5 | 0.125rem | 2px | Tiny |
| 1 | 0.25rem | 4px | Icon gaps |
| 2 | 0.5rem | 8px | Tight spacing |
| 3 | 0.75rem | 12px | Small components |
| 4 | 1rem | 16px | **Default/base** |
| 5 | 1.25rem | 20px | Comfortable |
| 6 | 1.5rem | 24px | Sections |
| 8 | 2rem | 32px | Large gaps |
| 10 | 2.5rem | 40px | Hero sections |
| 12 | 3rem | 48px | Major sections |
| 16 | 4rem | 64px | Page padding |
| 20 | 5rem | 80px | Extra large |
| 24 | 6rem | 96px | Hero spacing |

### Padding

```jsx
// All sides
<div className="p-4">           {/* 16px all sides */}

// Individual sides
<div className="pt-4">          {/* Top */}
<div className="pr-4">          {/* Right */}
<div className="pb-4">          {/* Bottom */}
<div className="pl-4">          {/* Left */}

// Axis
<div className="px-4">          {/* Left + Right (horizontal) */}
<div className="py-4">          {/* Top + Bottom (vertical) */}

// Common pattern: horizontal padding for containers
<div className="px-4 md:px-6 lg:px-8">
```

### Margin

```jsx
// All sides
<div className="m-4">           {/* 16px all sides */}

// Individual sides
<div className="mt-4">          {/* Top */}
<div className="mr-4">          {/* Right */}
<div className="mb-4">          {/* Bottom */}
<div className="ml-4">          {/* Left */}

// Axis
<div className="mx-4">          {/* Left + Right */}
<div className="my-4">          {/* Top + Bottom */}

// Auto margins (centering)
<div className="mx-auto">       {/* Center horizontally */}
<div className="ml-auto">       {/* Push to right */}
<div className="mr-auto">       {/* Push to left */}

// Negative margins
<div className="-mt-4">         {/* Pull up */}
<div className="-mx-4">         {/* Extend beyond parent padding */}
```

### Space Between (Children Spacing)

```jsx
// Vertical spacing between children
<div className="space-y-4">
  <p>First</p>
  <p>Second (has margin-top: 16px)</p>
  <p>Third (has margin-top: 16px)</p>
</div>

// Horizontal spacing
<div className="flex space-x-4">
  <Button>One</Button>
  <Button>Two</Button>
</div>

// Note: Prefer `gap` in flex/grid contexts
<div className="flex gap-4">   {/* Better for flex/grid */}
```

---

## Sizing (Width & Height)

### Width

| Class | Value | When to Use |
|-------|-------|-------------|
| `w-0` | 0px | Collapsed |
| `w-px` | 1px | Dividers |
| `w-1` to `w-96` | 4px to 384px | Fixed widths |
| `w-auto` | auto | Natural width |
| `w-1/2` | 50% | Half width |
| `w-1/3` | 33.333% | Third |
| `w-2/3` | 66.666% | Two-thirds |
| `w-1/4` | 25% | Quarter |
| `w-3/4` | 75% | Three-quarters |
| `w-full` | 100% | **Full width** |
| `w-screen` | 100vw | Viewport width |
| `w-min` | min-content | Shrink to content |
| `w-max` | max-content | Expand to content |
| `w-fit` | fit-content | Fit content (smart) |

### Height

| Class | Value | When to Use |
|-------|-------|-------------|
| `h-0` | 0px | Collapsed (for animations) |
| `h-px` | 1px | Thin lines |
| `h-1` to `h-96` | 4px to 384px | Fixed heights |
| `h-auto` | auto | Natural height |
| `h-1/2` | 50% | Half (of parent) |
| `h-full` | 100% | **Full height of parent** |
| `h-screen` | 100vh | Full viewport height |
| `h-svh` | 100svh | Safe viewport height (mobile) |
| `h-dvh` | 100dvh | Dynamic viewport height |
| `h-min` | min-content | Minimum content height |
| `h-max` | max-content | Maximum content height |
| `h-fit` | fit-content | Fit content |

### Min/Max Width & Height

```jsx
// Constrained containers
<div className="max-w-md">      {/* max-width: 28rem (448px) */}
<div className="max-w-lg">      {/* max-width: 32rem (512px) */}
<div className="max-w-xl">      {/* max-width: 36rem (576px) */}
<div className="max-w-2xl">     {/* max-width: 42rem (672px) */}
<div className="max-w-4xl">     {/* max-width: 56rem (896px) */}
<div className="max-w-6xl">     {/* max-width: 72rem (1152px) */}
<div className="max-w-7xl">     {/* max-width: 80rem (1280px) - Common page width */}
<div className="max-w-full">    {/* max-width: 100% */}
<div className="max-w-screen-xl"> {/* max-width: 1280px */}
<div className="max-w-prose">   {/* max-width: 65ch - Optimal reading width */}

// Min sizes
<div className="min-w-0">       {/* Allow shrinking in flex */}
<div className="min-h-screen">  {/* At least full viewport */}
<div className="min-h-0">       {/* Allow shrinking in flex */}
```

### Common Container Pattern (Next.js)

```jsx
// Page container with max-width and centered
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {children}
</main>

// Full-height page layout
<div className="min-h-screen flex flex-col">
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
</div>
```

---

## Typography

### Font Size

| Class | Size | Line Height | When to Use |
|-------|------|-------------|-------------|
| `text-xs` | 12px | 16px | Labels, captions |
| `text-sm` | 14px | 20px | Secondary text |
| `text-base` | 16px | 24px | **Body text (default)** |
| `text-lg` | 18px | 28px | Emphasized body |
| `text-xl` | 20px | 28px | Subheadings |
| `text-2xl` | 24px | 32px | Section headings |
| `text-3xl` | 30px | 36px | Page headings |
| `text-4xl` | 36px | 40px | Hero text |
| `text-5xl` | 48px | 48px | Large hero |
| `text-6xl` | 60px | 60px | Display |
| `text-7xl` | 72px | 72px | Massive display |
| `text-8xl` | 96px | 96px | Giant |
| `text-9xl` | 128px | 128px | Huge |

### Font Weight

| Class | Weight | When to Use |
|-------|--------|-------------|
| `font-thin` | 100 | Decorative |
| `font-extralight` | 200 | Light display |
| `font-light` | 300 | Subtle emphasis |
| `font-normal` | 400 | **Body text** |
| `font-medium` | 500 | Slight emphasis |
| `font-semibold` | 600 | **Headings, buttons** |
| `font-bold` | 700 | Strong emphasis |
| `font-extrabold` | 800 | Very strong |
| `font-black` | 900 | Maximum weight |

### Line Height

| Class | Value | When to Use |
|-------|-------|-------------|
| `leading-none` | 1 | Single line, headings |
| `leading-tight` | 1.25 | Compact headings |
| `leading-snug` | 1.375 | Tight body |
| `leading-normal` | 1.5 | **Default body** |
| `leading-relaxed` | 1.625 | Comfortable reading |
| `leading-loose` | 2 | Very spacious |

### Text Alignment

```jsx
<p className="text-left">     {/* Default */}
<p className="text-center">   {/* Centered */}
<p className="text-right">    {/* Right-aligned */}
<p className="text-justify">  {/* Justified */}
```

### Text Color

```jsx
<p className="text-gray-900">    {/* Near black - primary text */}
<p className="text-gray-700">    {/* Dark gray - secondary */}
<p className="text-gray-500">    {/* Medium - muted text */}
<p className="text-gray-400">    {/* Light - disabled */}
<p className="text-blue-600">    {/* Brand/link color */}
<p className="text-red-500">     {/* Error */}
<p className="text-green-500">   {/* Success */}
<p className="text-white">       {/* White text */}
```

### Text Transform & Decoration

```jsx
// Transform
<p className="uppercase">       {/* UPPERCASE */}
<p className="lowercase">       {/* lowercase */}
<p className="capitalize">      {/* Capitalize Each Word */}
<p className="normal-case">     {/* Reset */}

// Decoration
<p className="underline">           {/* Underlined */}
<p className="line-through">        {/* Strikethrough */}
<p className="no-underline">        {/* Remove underline */}
<a className="underline-offset-2">  {/* Space between text and underline */}
```

### Text Overflow

```jsx
// Truncate with ellipsis (single line)
<p className="truncate">
  This very long text will be cut off with ...
</p>

// Line clamping (multi-line truncate)
<p className="line-clamp-2">
  This text will show maximum 2 lines and then show ...
</p>
<p className="line-clamp-3">
  Maximum 3 lines...
</p>

// Prevent wrapping
<span className="whitespace-nowrap">Don't break this</span>

// Allow wrapping anywhere
<p className="break-all">Breaklongwordswithoutspaces</p>
<p className="break-words">Break at word boundaries</p>
```

### Font Family

```jsx
<p className="font-sans">    {/* System UI / Inter */}
<p className="font-serif">   {/* Georgia, serif */}
<p className="font-mono">    {/* Monospace - code */}
```

### Next.js Font Optimization

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}

// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)'],
      mono: ['var(--font-roboto-mono)'],
    },
  },
}
```

---

## Colors & Backgrounds

### Color Palette

Tailwind includes colors from 50 (lightest) to 950 (darkest):

```
50  100  200  300  400  500  600  700  800  900  950
|    |    |    |    |    |    |    |    |    |    |
lightest -----> default -----> darkest
```

### Color Examples

| Color | Light (bg) | Default | Dark (text) |
|-------|------------|---------|-------------|
| slate | `bg-slate-100` | `bg-slate-500` | `text-slate-900` |
| gray | `bg-gray-100` | `bg-gray-500` | `text-gray-900` |
| zinc | `bg-zinc-100` | `bg-zinc-500` | `text-zinc-900` |
| neutral | `bg-neutral-100` | `bg-neutral-500` | `text-neutral-900` |
| red | `bg-red-100` | `bg-red-500` | `text-red-700` |
| orange | `bg-orange-100` | `bg-orange-500` | `text-orange-700` |
| amber | `bg-amber-100` | `bg-amber-500` | `text-amber-700` |
| yellow | `bg-yellow-100` | `bg-yellow-500` | `text-yellow-700` |
| lime | `bg-lime-100` | `bg-lime-500` | `text-lime-700` |
| green | `bg-green-100` | `bg-green-500` | `text-green-700` |
| emerald | `bg-emerald-100` | `bg-emerald-500` | `text-emerald-700` |
| teal | `bg-teal-100` | `bg-teal-500` | `text-teal-700` |
| cyan | `bg-cyan-100` | `bg-cyan-500` | `text-cyan-700` |
| sky | `bg-sky-100` | `bg-sky-500` | `text-sky-700` |
| blue | `bg-blue-100` | `bg-blue-500` | `text-blue-700` |
| indigo | `bg-indigo-100` | `bg-indigo-500` | `text-indigo-700` |
| violet | `bg-violet-100` | `bg-violet-500` | `text-violet-700` |
| purple | `bg-purple-100` | `bg-purple-500` | `text-purple-700` |
| fuchsia | `bg-fuchsia-100` | `bg-fuchsia-500` | `text-fuchsia-700` |
| pink | `bg-pink-100` | `bg-pink-500` | `text-pink-700` |
| rose | `bg-rose-100` | `bg-rose-500` | `text-rose-700` |

### Common Color Patterns

```jsx
// Primary button
<button className="bg-blue-600 text-white hover:bg-blue-700">

// Secondary button
<button className="bg-gray-100 text-gray-900 hover:bg-gray-200">

// Success state
<div className="bg-green-50 text-green-700 border border-green-200">

// Error state
<div className="bg-red-50 text-red-700 border border-red-200">

// Warning state
<div className="bg-amber-50 text-amber-700 border border-amber-200">

// Info state
<div className="bg-blue-50 text-blue-700 border border-blue-200">
```

### Opacity

```jsx
// Background opacity
<div className="bg-black/50">   {/* 50% opacity black */}
<div className="bg-white/80">   {/* 80% opacity white */}
<div className="bg-blue-500/20"> {/* 20% opacity blue */}

// Text opacity
<p className="text-black/60">   {/* 60% opacity text */}

// Full element opacity
<div className="opacity-50">    {/* Entire element at 50% */}
<div className="opacity-0">     {/* Invisible (use for animations) */}
```

### Gradients

```jsx
// Linear gradient
<div className="bg-gradient-to-r from-blue-500 to-purple-500">

// Direction options
bg-gradient-to-t    {/* Bottom to top */}
bg-gradient-to-tr   {/* Bottom-left to top-right */}
bg-gradient-to-r    {/* Left to right */}
bg-gradient-to-br   {/* Top-left to bottom-right */}
bg-gradient-to-b    {/* Top to bottom */}
bg-gradient-to-bl   {/* Top-right to bottom-left */}
bg-gradient-to-l    {/* Right to left */}
bg-gradient-to-tl   {/* Bottom-right to top-left */}

// Three-color gradient
<div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">

// Gradient with transparency
<div className="bg-gradient-to-t from-black/80 to-transparent">
```

### Background Images

```jsx
// Background cover (most common)
<div
  className="bg-cover bg-center bg-no-repeat h-64"
  style={{ backgroundImage: "url('/hero.jpg')" }}
>

// Background position
bg-center    bg-top       bg-bottom
bg-left      bg-right
bg-left-top  bg-right-top
bg-left-bottom  bg-right-bottom

// Background size
bg-auto      {/* Original size */}
bg-cover     {/* Cover entire area */}
bg-contain   {/* Fit within area */}

// Background attachment
bg-fixed     {/* Parallax effect */}
bg-local     {/* Scroll with content */}
bg-scroll    {/* Scroll with viewport */}
```

---

## Borders & Rounded Corners

### Border Width

| Class | Width |
|-------|-------|
| `border-0` | 0px |
| `border` | 1px (default) |
| `border-2` | 2px |
| `border-4` | 4px |
| `border-8` | 8px |

### Individual Border Sides

```jsx
<div className="border-t">     {/* Top only */}
<div className="border-r">     {/* Right only */}
<div className="border-b">     {/* Bottom only */}
<div className="border-l">     {/* Left only */}
<div className="border-x">     {/* Left + Right */}
<div className="border-y">     {/* Top + Bottom */}

// With width
<div className="border-t-2">   {/* Top 2px */}
<div className="border-b-4">   {/* Bottom 4px */}
```

### Border Color

```jsx
<div className="border border-gray-200">     {/* Light border */}
<div className="border border-gray-300">     {/* Default border */}
<div className="border border-red-500">      {/* Error border */}
<div className="border border-transparent">  {/* For focus states */}
```

### Border Style

```jsx
<div className="border-solid">     {/* Solid (default) */}
<div className="border-dashed">    {/* Dashed */}
<div className="border-dotted">    {/* Dotted */}
<div className="border-none">      {/* No border */}
```

### Border Radius (Rounded Corners)

| Class | Radius | When to Use |
|-------|--------|-------------|
| `rounded-none` | 0 | Sharp corners |
| `rounded-sm` | 2px | Subtle rounding |
| `rounded` | 4px | Default, buttons |
| `rounded-md` | 6px | Cards, inputs |
| `rounded-lg` | 8px | **Most common for cards** |
| `rounded-xl` | 12px | Modern cards |
| `rounded-2xl` | 16px | Large cards |
| `rounded-3xl` | 24px | Very rounded |
| `rounded-full` | 9999px | **Pills, avatars, circles** |

### Individual Corners

```jsx
<div className="rounded-t-lg">     {/* Top corners only */}
<div className="rounded-r-lg">     {/* Right corners only */}
<div className="rounded-b-lg">     {/* Bottom corners only */}
<div className="rounded-l-lg">     {/* Left corners only */}

<div className="rounded-tl-lg">    {/* Top-left only */}
<div className="rounded-tr-lg">    {/* Top-right only */}
<div className="rounded-bl-lg">    {/* Bottom-left only */}
<div className="rounded-br-lg">    {/* Bottom-right only */}
```

### Divide (Borders Between Children)

```jsx
// Vertical list with dividers
<ul className="divide-y divide-gray-200">
  <li className="py-4">Item 1</li>
  <li className="py-4">Item 2</li>
  <li className="py-4">Item 3</li>
</ul>

// Horizontal list with dividers
<div className="flex divide-x divide-gray-200">
  <span className="px-4">One</span>
  <span className="px-4">Two</span>
  <span className="px-4">Three</span>
</div>
```

### Ring (Outline Alternative)

```jsx
// Focus ring (better than border for focus states)
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Ring variations
<div className="ring-1 ring-gray-200">     {/* Subtle ring */}
<div className="ring-2 ring-blue-500">     {/* Visible ring */}
<div className="ring-4 ring-blue-500/50">  {/* Large semi-transparent */}

// Ring offset (gap between element and ring)
<button className="ring-2 ring-offset-2 ring-blue-500">
```

---

## Shadows & Effects

### Box Shadow

| Class | When to Use |
|-------|-------------|
| `shadow-sm` | Subtle elevation (buttons) |
| `shadow` | Light elevation (cards) |
| `shadow-md` | **Default cards** |
| `shadow-lg` | Dropdowns, popovers |
| `shadow-xl` | Modals |
| `shadow-2xl` | Floating elements |
| `shadow-inner` | Inset effect (inputs) |
| `shadow-none` | Remove shadow |

### Colored Shadows

```jsx
// Shadow with color
<div className="shadow-lg shadow-blue-500/50">
<div className="shadow-xl shadow-purple-500/30">
```

### Blur & Backdrop Blur

```jsx
// Blur the element itself
<div className="blur-sm">      {/* Slight blur */}
<div className="blur">         {/* Default blur */}
<div className="blur-md">      {/* Medium blur */}
<div className="blur-lg">      {/* Large blur */}

// Backdrop blur (blur what's behind - for glass effect)
<div className="backdrop-blur-sm bg-white/30">
<div className="backdrop-blur-md bg-black/50">
```

### Glassmorphism Example

```jsx
<div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl shadow-xl">
  Glass effect content
</div>
```

---

## Responsive Design

### Breakpoints

| Prefix | Min Width | CSS | Typical Device |
|--------|-----------|-----|----------------|
| (none) | 0px | Default | Mobile |
| `sm:` | 640px | @media (min-width: 640px) | Large phones |
| `md:` | 768px | @media (min-width: 768px) | Tablets |
| `lg:` | 1024px | @media (min-width: 1024px) | Laptops |
| `xl:` | 1280px | @media (min-width: 1280px) | Desktops |
| `2xl:` | 1536px | @media (min-width: 1536px) | Large screens |

### Mobile-First Approach

```jsx
// Always start with mobile, then add breakpoints
<div className="
  flex flex-col          /* Mobile: stack vertically */
  md:flex-row            /* Tablet+: side by side */
">

<div className="
  text-sm                /* Mobile: small text */
  md:text-base           /* Tablet: normal */
  lg:text-lg             /* Desktop: larger */
">

<div className="
  grid grid-cols-1       /* Mobile: single column */
  sm:grid-cols-2         /* Small: 2 columns */
  lg:grid-cols-3         /* Large: 3 columns */
  xl:grid-cols-4         /* XL: 4 columns */
">
```

### Common Responsive Patterns

```jsx
// Hide/Show at breakpoints
<div className="hidden md:block">       {/* Hidden on mobile, visible on md+ */}
<div className="block md:hidden">       {/* Visible on mobile, hidden on md+ */}
<div className="hidden lg:flex">        {/* Hidden until lg, then flex */}

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

// Responsive spacing
<section className="py-12 md:py-16 lg:py-24">
```

### Container Queries (Tailwind v3.4+)

```jsx
// Container query based on parent width (not viewport)
<div className="@container">
  <div className="@md:flex @lg:grid">
    Responds to container width
  </div>
</div>
```

---

## States & Pseudo-classes

### Interactive States

```jsx
// Hover
<button className="bg-blue-500 hover:bg-blue-600">

// Focus
<input className="focus:outline-none focus:ring-2 focus:ring-blue-500">

// Active (while clicking)
<button className="active:scale-95">

// Disabled
<button className="disabled:opacity-50 disabled:cursor-not-allowed" disabled>

// Focus-visible (keyboard focus only)
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">
```

### Form States

```jsx
// Placeholder
<input className="placeholder:text-gray-400 placeholder:italic">

// Required
<input className="required:border-red-500" required>

// Invalid
<input className="invalid:border-red-500">

// Read-only
<input className="read-only:bg-gray-100" readOnly>

// Checked (checkboxes/radios)
<input type="checkbox" className="checked:bg-blue-500">
```

### Group & Peer States

```jsx
// Group hover (child responds to parent hover)
<div className="group">
  <img src="..." />
  <div className="opacity-0 group-hover:opacity-100">
    Overlay appears on card hover
  </div>
</div>

// Peer (sibling responds to sibling state)
<input className="peer" placeholder="Email" />
<p className="invisible peer-invalid:visible text-red-500">
  Invalid email format
</p>
```

### Child Selectors

```jsx
// First child
<li className="first:pt-0">

// Last child
<li className="last:pb-0">

// Odd children
<tr className="odd:bg-gray-50">

// Even children
<tr className="even:bg-white">

// Only child
<p className="only:text-center">
```

### Before & After Pseudo-elements

```jsx
// Before pseudo-element
<span className="before:content-['→'] before:mr-2">Link</span>

// After pseudo-element
<span className="after:content-['*'] after:ml-1 after:text-red-500">Required</span>

// Decorative line
<h2 className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-blue-500">
```

---

## Animations & Transitions

### Transitions

```jsx
// Basic transition
<button className="transition hover:bg-blue-600">
  {/* Transitions all properties */}
</button>

// Specific property transitions
<div className="transition-colors">     {/* Only colors */}
<div className="transition-opacity">    {/* Only opacity */}
<div className="transition-transform">  {/* Only transforms */}
<div className="transition-shadow">     {/* Only shadows */}
<div className="transition-all">        {/* All properties */}

// Duration
<div className="transition duration-150">   {/* 150ms (fast) */}
<div className="transition duration-300">   {/* 300ms (default) */}
<div className="transition duration-500">   {/* 500ms (slow) */}
<div className="transition duration-700">   {/* 700ms (very slow) */}

// Easing
<div className="transition ease-linear">      {/* Linear */}
<div className="transition ease-in">          {/* Slow start */}
<div className="transition ease-out">         {/* Slow end */}
<div className="transition ease-in-out">      {/* Slow start & end */}

// Delay
<div className="transition delay-100">        {/* 100ms delay */}
<div className="transition delay-300">        {/* 300ms delay */}
```

### Common Transition Pattern

```jsx
<button className="
  bg-blue-500
  hover:bg-blue-600
  hover:shadow-lg
  hover:-translate-y-0.5
  transition-all
  duration-200
  ease-out
">
  Hover me
</button>

// Card with hover effect
<div className="
  bg-white
  rounded-lg
  shadow
  hover:shadow-xl
  transition-shadow
  duration-300
">
```

### Transforms

```jsx
// Scale
<div className="hover:scale-105">     {/* 105% size */}
<div className="hover:scale-110">     {/* 110% size */}
<div className="active:scale-95">     {/* Shrink on click */}

// Rotate
<div className="hover:rotate-3">      {/* Slight rotation */}
<div className="hover:rotate-6">      {/* More rotation */}
<div className="hover:rotate-180">    {/* Half turn */}
<div className="hover:-rotate-3">     {/* Counter-clockwise */}

// Translate (move)
<div className="hover:translate-x-1"> {/* Move right */}
<div className="hover:-translate-y-1">{/* Move up */}
<div className="hover:translate-y-1"> {/* Move down */}

// Skew
<div className="hover:skew-x-3">      {/* Skew horizontally */}
<div className="hover:skew-y-3">      {/* Skew vertically */}

// Transform origin
<div className="origin-center">       {/* Default */}
<div className="origin-top">          {/* Transform from top */}
<div className="origin-bottom-right"> {/* From bottom-right */}
```

### Built-in Animations

```jsx
// Spin (loading spinners)
<svg className="animate-spin h-5 w-5">

// Ping (notification dot)
<span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-sky-400">

// Pulse (skeleton loading)
<div className="animate-pulse bg-gray-200 h-4 w-full rounded">

// Bounce (attention grabber)
<div className="animate-bounce">↓</div>
```

### Custom Animation Example

```jsx
// tailwind.config.ts
theme: {
  extend: {
    animation: {
      'fade-in': 'fadeIn 0.3s ease-out',
      'slide-up': 'slideUp 0.3s ease-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
    },
  },
}

// Usage
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-up">Slides up</div>
```

---

## Dark Mode

### Setup (Next.js)

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark"> {/* or use a theme provider */}
      <body>{children}</body>
    </html>
  )
}

// tailwind.config.ts
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ...
}
```

### Using Dark Mode

```jsx
// Basic dark mode
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-white">

// Complete example
<div className="
  bg-white
  dark:bg-gray-800
  text-gray-900
  dark:text-gray-100
  border
  border-gray-200
  dark:border-gray-700
">
  Card content
</div>

// Dark mode with hover
<button className="
  bg-blue-500
  hover:bg-blue-600
  dark:bg-blue-600
  dark:hover:bg-blue-500
">
```

### Theme Toggle Component

```tsx
'use client'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

---

## Common Component Patterns

### Buttons

```jsx
// Primary Button
<button className="
  px-4 py-2
  bg-blue-600 text-white
  rounded-lg
  hover:bg-blue-700
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Primary
</button>

// Secondary Button
<button className="
  px-4 py-2
  bg-gray-100 text-gray-900
  rounded-lg
  hover:bg-gray-200
  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
  transition-colors
">
  Secondary
</button>

// Outline Button
<button className="
  px-4 py-2
  border-2 border-blue-600 text-blue-600
  rounded-lg
  hover:bg-blue-600 hover:text-white
  transition-colors
">
  Outline
</button>

// Ghost Button
<button className="
  px-4 py-2
  text-gray-600
  rounded-lg
  hover:bg-gray-100
  transition-colors
">
  Ghost
</button>

// Icon Button
<button className="
  p-2
  rounded-full
  hover:bg-gray-100
  transition-colors
">
  <Icon className="w-5 h-5" />
</button>
```

### Cards

```jsx
// Basic Card
<div className="
  bg-white
  rounded-lg
  shadow-md
  p-6
">
  Card content
</div>

// Card with Image
<div className="
  bg-white
  rounded-xl
  shadow-lg
  overflow-hidden
">
  <img
    src="/image.jpg"
    alt=""
    className="w-full h-48 object-cover"
  />
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2">Title</h3>
    <p className="text-gray-600">Description</p>
  </div>
</div>

// Hover Card
<div className="
  bg-white
  rounded-xl
  shadow
  p-6
  hover:shadow-xl
  hover:-translate-y-1
  transition-all
  duration-300
">
  Interactive card
</div>
```

### Form Inputs

```jsx
// Text Input
<input
  type="text"
  className="
    w-full
    px-4 py-2
    border border-gray-300
    rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    placeholder:text-gray-400
  "
  placeholder="Enter text..."
/>

// Input with Label
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Email
  </label>
  <input
    type="email"
    className="
      w-full px-4 py-2
      border border-gray-300 rounded-lg
      focus:ring-2 focus:ring-blue-500 focus:border-transparent
    "
  />
</div>

// Input with Error
<div>
  <input
    className="
      w-full px-4 py-2
      border border-red-500
      rounded-lg
      focus:ring-2 focus:ring-red-500
    "
  />
  <p className="mt-1 text-sm text-red-500">This field is required</p>
</div>

// Select
<select className="
  w-full
  px-4 py-2
  border border-gray-300
  rounded-lg
  focus:ring-2 focus:ring-blue-500
  bg-white
">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Checkbox
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="
      w-4 h-4
      rounded
      border-gray-300
      text-blue-600
      focus:ring-blue-500
    "
  />
  <span className="text-gray-700">Accept terms</span>
</label>
```

### Navigation

```jsx
// Top Navigation
<nav className="
  fixed top-0 left-0 right-0
  h-16
  bg-white/80 backdrop-blur-md
  border-b border-gray-200
  z-50
">
  <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
    <Logo />
    <div className="hidden md:flex items-center gap-6">
      <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
      <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
      <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
    </div>
    <button className="md:hidden p-2">
      <MenuIcon />
    </button>
  </div>
</nav>

// Sidebar Navigation
<aside className="
  fixed left-0 top-0 bottom-0
  w-64
  bg-gray-900 text-white
  p-4
">
  <nav className="space-y-2">
    <a className="block px-4 py-2 rounded-lg bg-gray-800">Dashboard</a>
    <a className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Settings</a>
  </nav>
</aside>
```

### Badges & Tags

```jsx
// Status Badge
<span className="
  inline-flex items-center
  px-2.5 py-0.5
  rounded-full
  text-xs font-medium
  bg-green-100 text-green-800
">
  Active
</span>

// Notification Badge
<div className="relative">
  <BellIcon className="w-6 h-6" />
  <span className="
    absolute -top-1 -right-1
    w-4 h-4
    bg-red-500 text-white
    text-xs
    rounded-full
    flex items-center justify-center
  ">
    3
  </span>
</div>
```

### Modals/Dialogs

```jsx
// Modal Overlay
<div className="
  fixed inset-0
  bg-black/50
  backdrop-blur-sm
  z-50
  flex items-center justify-center
">
  {/* Modal Content */}
  <div className="
    bg-white
    rounded-2xl
    shadow-2xl
    w-full max-w-md
    mx-4
    p-6
  ">
    <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
    <p className="text-gray-600 mb-6">Modal content here...</p>
    <div className="flex gap-3 justify-end">
      <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
        Cancel
      </button>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Avatar

```jsx
// Basic Avatar
<img
  src="/avatar.jpg"
  alt="User"
  className="w-10 h-10 rounded-full object-cover"
/>

// Avatar with Fallback
<div className="
  w-10 h-10
  rounded-full
  bg-blue-500
  flex items-center justify-center
  text-white font-medium
">
  JD
</div>

// Avatar with Status
<div className="relative">
  <img src="/avatar.jpg" className="w-10 h-10 rounded-full" />
  <span className="
    absolute bottom-0 right-0
    w-3 h-3
    bg-green-500
    border-2 border-white
    rounded-full
  "></span>
</div>

// Avatar Group
<div className="flex -space-x-2">
  <img className="w-8 h-8 rounded-full border-2 border-white" src="/1.jpg" />
  <img className="w-8 h-8 rounded-full border-2 border-white" src="/2.jpg" />
  <img className="w-8 h-8 rounded-full border-2 border-white" src="/3.jpg" />
  <span className="
    w-8 h-8
    rounded-full
    bg-gray-100
    border-2 border-white
    flex items-center justify-center
    text-xs text-gray-600
  ">
    +5
  </span>
</div>
```

### Loading States

```jsx
// Spinner
<div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>

// Skeleton Loading
<div className="space-y-3">
  <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
  <div className="animate-pulse h-4 bg-gray-200 rounded w-5/6"></div>
</div>

// Skeleton Card
<div className="bg-white rounded-lg p-4 shadow animate-pulse">
  <div className="h-32 bg-gray-200 rounded mb-4"></div>
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

---

## Performance Tips for Next.js

### 1. Avoid Dynamic Classes When Possible

```jsx
// Bad - Tailwind can't purge these
const color = 'blue'
<div className={`bg-${color}-500`}>  // Won't work!

// Good - Use complete class names
const colorClasses = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
}
<div className={colorClasses[color]}>
```

### 2. Use @apply Sparingly

```css
/* Use @apply for repetitive patterns only */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg;
  }
}

/* Don't overuse - prefer inline classes for component-specific styles */
```

### 3. Extract Reusable Components

```tsx
// components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'text-gray-600 hover:bg-gray-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  return (
    <button className={`
      rounded-lg font-medium transition-colors
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]}
      ${sizes[size]}
    `}>
      {children}
    </button>
  )
}
```

### 4. Use clsx or cn for Conditional Classes

```tsx
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function (common pattern)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<button className={cn(
  'px-4 py-2 rounded-lg',
  isActive && 'bg-blue-600 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed',
  className // Allow overrides
)}>
```

### 5. Use CSS Variables for Theming

```css
/* globals.css */
:root {
  --color-primary: 59 130 246;  /* blue-500 RGB */
  --color-background: 255 255 255;
}

.dark {
  --color-primary: 96 165 250;  /* blue-400 RGB */
  --color-background: 17 24 39;
}
```

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: 'rgb(var(--color-primary) / <alpha-value>)',
      background: 'rgb(var(--color-background) / <alpha-value>)',
    }
  }
}
```

---

## Advanced Techniques

### Arbitrary Values

```jsx
// When you need exact values not in the scale
<div className="w-[137px]">         {/* Exact width */}
<div className="h-[calc(100vh-80px)]"> {/* Calc values */}
<div className="grid-cols-[1fr_2fr_1fr]"> {/* Custom grid */}
<div className="bg-[#1a2b3c]">      {/* Hex color */}
<div className="text-[13px]">       {/* Exact font size */}
<div className="top-[117px]">       {/* Exact position */}
<div className="content-['Hello']"> {/* CSS content */}
```

### Important Modifier

```jsx
// Force a style to take precedence
<div className="!mt-0">  {/* !important margin-top: 0 */}
<div className="!hidden"> {/* Force hide */}
```

### Arbitrary Variants

```jsx
// Target specific breakpoints or states
<div className="[&:nth-child(3)]:bg-red-500">
<div className="[&>*]:p-4">         {/* Direct children */}
<div className="[@media(min-width:900px)]:flex">
```

### Print Styles

```jsx
<div className="print:hidden">       {/* Hide when printing */}
<div className="print:text-black">   {/* Black text for print */}
```

### Aspect Ratio

```jsx
<div className="aspect-video">       {/* 16:9 */}
<div className="aspect-square">      {/* 1:1 */}
<div className="aspect-[4/3]">       {/* Custom 4:3 */}
```

### Object Fit (for images/video)

```jsx
<img className="object-cover">       {/* Cover container, crop */}
<img className="object-contain">     {/* Fit inside, letterbox */}
<img className="object-fill">        {/* Stretch to fill */}
<img className="object-none">        {/* Natural size */}
<img className="object-scale-down">  {/* Smaller of contain/none */}

// Position
<img className="object-center">
<img className="object-top">
<img className="object-left-bottom">
```

### Scroll Behavior

```jsx
// Smooth scrolling
<html className="scroll-smooth">

// Scroll snap
<div className="snap-x snap-mandatory overflow-x-auto flex">
  <div className="snap-center shrink-0 w-80">Slide 1</div>
  <div className="snap-center shrink-0 w-80">Slide 2</div>
</div>

// Scroll margin (for fixed headers)
<section id="about" className="scroll-mt-20">
  {/* Accounts for 80px header when scrolling to #about */}
</section>
```

### Overscroll Behavior

```jsx
<div className="overscroll-contain">  {/* Prevent scroll chaining */}
<div className="overscroll-none">     {/* Disable overscroll effects */}
```

### Pointer Events

```jsx
<div className="pointer-events-none">  {/* Click through */}
<div className="pointer-events-auto">  {/* Restore clicking */}
```

### Select & Cursor

```jsx
// User select
<p className="select-none">      {/* Can't select text */}
<p className="select-text">      {/* Can select */}
<p className="select-all">       {/* Select all on click */}

// Cursor
<div className="cursor-pointer">  {/* Hand */}
<div className="cursor-wait">     {/* Loading */}
<div className="cursor-not-allowed"> {/* Disabled */}
<div className="cursor-grab">     {/* Grab hand */}
<div className="cursor-grabbing"> {/* Grabbing */}
```

### Will-Change (Performance Optimization)

```jsx
// Hint to browser about what will animate
<div className="will-change-transform">  {/* Optimize for transform */}
<div className="will-change-opacity">    {/* Optimize for opacity */}
<div className="will-change-scroll">     {/* Optimize for scroll */}
```

---

## Quick Reference Card

### Most Used Classes

```
LAYOUT:        flex  flex-col  items-center  justify-between  gap-4
SPACING:       p-4  px-6  py-2  m-4  mt-8  space-y-4
SIZING:        w-full  h-screen  max-w-7xl  min-h-screen
TEXT:          text-lg  font-semibold  text-gray-900  text-center
COLORS:        bg-white  bg-gray-100  text-blue-600  border-gray-200
BORDERS:       border  rounded-lg  rounded-full  shadow-md
RESPONSIVE:    sm:  md:  lg:  xl:  2xl:
STATES:        hover:  focus:  active:  disabled:  dark:
TRANSITIONS:   transition  duration-300  ease-out
POSITION:      relative  absolute  fixed  sticky  z-50
```

### Mental Model

1. **Layout first**: Container type (flex/grid), direction, alignment
2. **Sizing**: Width, height, constraints
3. **Spacing**: Padding (inside), margin (outside), gaps
4. **Typography**: Size, weight, color, alignment
5. **Visual**: Background, borders, shadows
6. **Responsive**: Mobile-first, add breakpoints
7. **Interactive**: Hover, focus, transitions
8. **Dark mode**: Add dark: variants

---

## Resources

- [Official Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground
- [Tailwind UI](https://tailwindui.com/) - Official component library
- [Headless UI](https://headlessui.com/) - Unstyled accessible components
- [Heroicons](https://heroicons.com/) - Icons from Tailwind team
