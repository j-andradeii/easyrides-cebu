# Horizontal Accordion Implementation Explained

This document explains the technical implementation of the interactive horizontal accordion found in `src/components/landing/ServicesSection.tsx`.

## Core Concept
The accordion is built using **CSS Flexbox** and **Tailwind CSS transitions**. Instead of calculating pixel widths with JavaScript, we manipulate the `flex-grow` property of each panel based on its state.

## 1. State Management
We use a simple `useState` hook to track which panel is currently expanded.

```tsx
const [activeId, setActiveId] = useState(0); // Default to first item active
```

When a user clicks a panel, we update this ID:
```tsx
onClick={() => setActiveId(index)}
```

## 2. Flexbox "Spring" Logic
This is the most important part. The parent container is a flex container. The children (panels) have dynamic `flex` values based on whether they are active or inactive.

```tsx
// Parent Container
<div className="flex flex-col lg:flex-row ...">

// Child Panel (Simplified)
<div
  className={`
    transition-all duration-700 ease-in-out
    ${isActive 
       ? 'flex-[10] lg:flex-[3]'   // Active: Take up 3 portions of space
       : 'flex-[2] lg:flex-[0.5]'  // Inactive: Take up 0.5 portions of space
    }
  `}
>
```

### How it works:
-   **Total Flex Space**: The browser calculates the total available space.
-   **Distribution**: If you have 5 items:
    -   1 Active item (`flex: 3`)
    -   4 Inactive items (`flex: 0.5` * 4 = `2`)
    -   Total shares = 5.
    -   The active item gets 3/5ths (60%) of the width.
    -   Each inactive item gets 0.5/5ths (10%) of the width.
-   **Responsiveness**: On mobile (`flex-col`), we calculate vertical space instead of horizontal width, using the same logic.

## 3. Smooth Transitions
The magic that makes it feel like an accordion is the CSS transition on the flex property.

```css
transition-all duration-700 ease-in-out
```

Tailwind's `transition-all` includes the `flex` property. When the class changes from `flex-[0.5]` to `flex-[3]`, the browser smoothly animates the width change over 700ms.

## 4. Content Visibility
We hide and show content based on the state to prevent layout issues during the animation.

### Active Content (Title, Desc, Button)
We use opacity and translation to fade it in/out.
```tsx
${isActive 
  ? 'opacity-100 translate-y-0' 
  : 'opacity-0 translate-y-8 pointer-events-none hidden lg:flex'
}
```

### Inactive Content (Vertical Text)
We show this only when the card is collapsed.
```tsx
${isActive ? 'opacity-0' : 'opacity-100'}
```

## 5. Vertical Text Trick
To display the text bottom-to-top on inactive panels without breaking layout flow, we rotate the container.

```tsx
// Rotates the entire text container -90 degrees
<div className="lg:-rotate-90 ...">
   <span className="Tracking-widest ...">RENTALS</span>
</div>
```

## 6. Key Tailwind Utilities Used

Here is a breakdown of the specific Tailwind utility classes that power this component:

### Layout & Flexbox
-   `flex`: Enables Flexbox layout.
-   `flex-col` / `lg:flex-row`: Stacks items vertically on mobile, horizontally on desktop (large screens).
-   `flex-[n]`: Uses the arbitrary value syntax i.e. `flex-grow: n`. This is the core mechanism for expansion.
    -   `flex-[3]`: Grow factor of 3 (Active, Desktop).
    -   `flex-[0.5]`: Grow factor of 0.5 (Inactive, Desktop).

### Transitions & Animation
-   `transition-all`: Animates all changeable properties (including flex-grow, opacity, transform).
-   `duration-700`: Sets the animation duration to 700ms (0.7s) for a slow, premium feel.
-   `ease-in-out`: Starts slow, speeds up, then slows down, creating a natural motion.

### Positioning & Visuals
-   `relative` / `absolute`: Used to layer the background image, gradient overlay, and text content on top of each other.
-   `inset-0`: Shorthand for `top: 0; right: 0; bottom: 0; left: 0;`, making the element fill its parent.
-   `overflow-hidden`: Ensures the background image and content don't spill out of the rounded corners.
-   `rounded-3xl`: Adds large border radius (24px) for the modern pill/card shape.

### Transforms
-   `lg:-rotate-90`: Rotates the inactive text container 90 degrees counter-clockwise on desktop.
-   `translate-y-8`: Moves content down by 2rem. Used with opacity to create the "slide up and fade in" entrance animation.

## Summary
1.  **Parent** is `flex`.
2.  **Children** change their `flex-grow` value based on `activeId`.
3.  **CSS Transition** smooths the change in width.
4.  **Content** fades in/out based on state.
