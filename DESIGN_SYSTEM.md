# Stream Watch - Design System

## Color Palette

### Light Mode Theme

#### Primary Colors
```
Background: #FFFFFF (White)
Surface: #F9FAFB (Gray-50)
Card: #FFFFFF with shadow
```

#### Accent Colors
```
Primary Blue: #3B82F6 (Blue-500)
Primary Blue Hover: #2563EB (Blue-600)
Primary Blue Dark: #1D4ED8 (Blue-700)
Gradient: from-blue-500 to-blue-600
```

#### Text Colors
```
Heading: #111827 (Gray-900)
Body: #374151 (Gray-700)
Secondary: #6B7280 (Gray-600)
Muted: #9CA3AF (Gray-400)
```

#### Border Colors
```
Default: #E5E7EB (Gray-200)
Hover: #D1D5DB (Gray-300)
```

#### Status Colors
```
Success: #10B981 (Green-500)
Success BG: #ECFDF5 (Green-50)
Error: #EF4444 (Red-500)
Error BG: #FEF2F2 (Red-50)
Warning: #F59E0B (Yellow-500)
Warning BG: #FFFBEB (Yellow-50)
Info: #3B82F6 (Blue-500)
Info BG: #EFF6FF (Blue-50)
```

---

### Dark Mode Theme

#### Primary Colors
```
Background: #111827 (Gray-900)
Surface: #1F2937 (Gray-800)
Card: #1F2937 with shadow
```

#### Accent Colors
```
Primary Blue: #3B82F6 (Blue-500)
Primary Blue Hover: #60A5FA (Blue-400)
Primary Blue Light: #93C5FD (Blue-300)
Gradient: from-blue-500 to-blue-600
```

#### Text Colors
```
Heading: #FFFFFF (White)
Body: #D1D5DB (Gray-300)
Secondary: #9CA3AF (Gray-400)
Muted: #6B7280 (Gray-500)
```

#### Border Colors
```
Default: #374151 (Gray-700)
Hover: #4B5563 (Gray-600)
```

#### Status Colors
```
Success: #10B981 (Green-500)
Success BG: rgba(16, 185, 129, 0.1)
Error: #EF4444 (Red-500)
Error BG: rgba(239, 68, 68, 0.1)
Warning: #F59E0B (Yellow-500)
Warning BG: rgba(245, 158, 11, 0.1)
Info: #3B82F6 (Blue-500)
Info BG: rgba(59, 130, 246, 0.1)
```

---

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
             'Helvetica Neue', sans-serif;
```

### Font Sizes
```
text-xs: 0.75rem (12px)
text-sm: 0.875rem (14px)
text-base: 1rem (16px)
text-lg: 1.125rem (18px)
text-xl: 1.25rem (20px)
text-2xl: 1.5rem (24px)
text-3xl: 1.875rem (30px)
```

### Font Weights
```
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

---

## Spacing System

### Padding/Margin Scale
```
p-1: 0.25rem (4px)
p-2: 0.5rem (8px)
p-3: 0.75rem (12px)
p-4: 1rem (16px)
p-5: 1.25rem (20px)
p-6: 1.5rem (24px)
p-8: 2rem (32px)
```

### Gap Scale
```
gap-1: 0.25rem (4px)
gap-2: 0.5rem (8px)
gap-3: 0.75rem (12px)
gap-4: 1rem (16px)
gap-6: 1.5rem (24px)
```

---

## Border Radius

### Rounded Corners
```
rounded-lg: 0.5rem (8px) - Small cards
rounded-xl: 0.75rem (12px) - Medium cards, inputs
rounded-2xl: 1rem (16px) - Large cards, modals
rounded-full: 9999px - Circular elements
```

---

## Shadows

### Shadow Levels
```
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

### Colored Shadows
```
Blue: shadow-blue-500/30
Red: shadow-red-500/30
```

---

## Components

### Buttons

#### Primary Button
```css
Light Mode:
- Background: gradient from-blue-500 to-blue-600
- Text: white
- Hover: from-blue-600 to-blue-700
- Shadow: shadow-lg

Dark Mode:
- Same as light mode
- Shadow: shadow-lg
```

#### Secondary Button
```css
Light Mode:
- Background: gray-100
- Text: gray-700
- Hover: gray-200
- Border: none

Dark Mode:
- Background: gray-700
- Text: gray-300
- Hover: gray-600
- Border: none
```

#### Danger Button
```css
Light Mode:
- Background: red-500
- Text: white
- Hover: red-600
- Shadow: shadow-lg shadow-red-500/30

Dark Mode:
- Same as light mode
```

### Cards

#### Standard Card
```css
Light Mode:
- Background: white
- Border: 1px solid gray-200
- Rounded: rounded-2xl
- Shadow: shadow-lg
- Padding: p-6

Dark Mode:
- Background: gray-800
- Border: 1px solid gray-700
- Rounded: rounded-2xl
- Shadow: shadow-lg
- Padding: p-6
```

### Inputs

#### Text Input
```css
Light Mode:
- Background: white
- Border: 1px solid gray-300
- Rounded: rounded-xl
- Padding: px-4 py-3
- Focus: ring-2 ring-blue-500

Dark Mode:
- Background: gray-700
- Border: 1px solid gray-600
- Rounded: rounded-xl
- Padding: px-4 py-3
- Focus: ring-2 ring-blue-500
```

#### Textarea
```css
Same as text input
- Resize: resize-none
- Rows: 4
```

### Icons

#### Icon Sizes
```
Small: w-4 h-4 (16px)
Medium: w-5 h-5 (20px)
Large: w-6 h-6 (24px)
XLarge: w-7 h-7 (28px)
XXLarge: w-12 h-12 (48px)
```

#### Icon Colors
```
Primary: text-blue-500
Success: text-green-500
Error: text-red-500
Warning: text-yellow-500
Info: text-purple-500
Muted: text-gray-400 dark:text-gray-500
```

---

## Layout

### Sidebar
```css
Width: w-64 (256px)
Background Light: white
Background Dark: gray-800
Border Light: border-r border-gray-200
Border Dark: border-r border-gray-700
Shadow: shadow-lg
```

### Navigation Items
```css
Inactive Light:
- Text: gray-700
- Hover: bg-gray-100

Inactive Dark:
- Text: gray-300
- Hover: bg-gray-700

Active (Both):
- Background: gradient from-blue-500 to-blue-600
- Text: white
- Shadow: shadow-lg shadow-blue-500/30
- Rounded: rounded-xl
```

### Content Area
```css
Light Mode:
- Background: gray-50
- Padding: p-6 to p-8

Dark Mode:
- Background: gray-900
- Padding: p-6 to p-8
```

---

## Status Indicators

### Success State
```css
Light Mode:
- Background: green-50
- Border: green-200
- Text: green-800
- Icon: green-600

Dark Mode:
- Background: green-900/20
- Border: green-800
- Text: green-300
- Icon: green-400
```

### Error State
```css
Light Mode:
- Background: red-50
- Border: red-200
- Text: red-800
- Icon: red-600

Dark Mode:
- Background: red-900/20
- Border: red-800
- Text: red-300
- Icon: red-400
```

### Warning State
```css
Light Mode:
- Background: yellow-50
- Border: yellow-200
- Text: yellow-800
- Icon: yellow-600

Dark Mode:
- Background: yellow-900/20
- Border: yellow-800
- Text: yellow-300
- Icon: yellow-400
```

### Info State
```css
Light Mode:
- Background: blue-50
- Border: blue-200
- Text: blue-800
- Icon: blue-600

Dark Mode:
- Background: blue-900/20
- Border: blue-800
- Text: blue-300
- Icon: blue-400
```

---

## Animations

### Transitions
```css
Default: transition-all duration-200
Colors: transition-colors duration-200
Transform: transition-transform duration-200
```

### Hover Effects
```css
Scale: hover:scale-105
Shadow: hover:shadow-xl
Brightness: hover:brightness-110
```

### Loading Spinner
```css
Animation: animate-spin
Border: border-b-2 border-blue-600
Size: h-8 w-8
```

---

## Gradients

### Primary Gradient
```css
from-blue-500 to-blue-600
```

### Header Gradient
```css
from-blue-500 to-purple-600
```

### Background Gradient (Light)
```css
from-blue-50 via-white to-blue-100
```

### Background Gradient (Dark)
```css
from-gray-900 via-gray-800 to-blue-900
```

---

## Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Grid Layouts
```css
Mobile: grid-cols-1
Tablet: md:grid-cols-2
Desktop: lg:grid-cols-3
```

---

## Accessibility

### Focus States
```css
All interactive elements:
- focus:ring-2
- focus:ring-blue-500
- focus:border-transparent
- outline-none
```

### Color Contrast
```
Light Mode: WCAG AA compliant
Dark Mode: WCAG AA compliant
Minimum contrast ratio: 4.5:1
```

### Screen Reader Support
```
All icons have aria-labels
All forms have proper labels
All buttons have descriptive text
```

---

## Code Syntax Highlighting

### Terminal/Code Blocks
```css
Background: gray-900 / gray-950
Text: green-400
Border: rounded-xl
Padding: p-4
Font: font-mono
Size: text-xs
```

---

## Usage Examples

### Primary Button
```jsx
<button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 
                   hover:from-blue-600 hover:to-blue-700 
                   text-white font-medium py-3 rounded-xl 
                   transition-all shadow-lg hover:shadow-xl">
  Click Me
</button>
```

### Card
```jsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg 
                border border-gray-200 dark:border-gray-700 p-6">
  Card Content
</div>
```

### Input
```jsx
<input className="w-full px-4 py-3 
                  border border-gray-300 dark:border-gray-600 
                  rounded-xl 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  outline-none 
                  bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white 
                  placeholder-gray-400 dark:placeholder-gray-500" />
```

### Icon
```jsx
<svg className="w-5 h-5 text-blue-500" 
     fill="none" 
     stroke="currentColor" 
     viewBox="0 0 24 24">
  <path strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="..." />
</svg>
```

---

## Design Principles

1. **Consistency**: Use the same patterns throughout
2. **Clarity**: Clear visual hierarchy
3. **Simplicity**: Remove unnecessary elements
4. **Accessibility**: WCAG AA compliant
5. **Responsiveness**: Works on all screen sizes
6. **Performance**: Optimized animations and transitions
7. **Professionalism**: No emojis, clean icons
8. **Elegance**: Subtle gradients and shadows

---

This design system ensures a cohesive, professional, and accessible user interface across the entire Stream Watch application.
