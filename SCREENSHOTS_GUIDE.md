# Screenshots Guide

This document describes what each screen looks like for documentation purposes.

---

## 1. Login Page (Light Mode)

### Visual Description
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Blue Gradient Icon Badge]            │
│                  Stream Watch                       │
│           Real-Time Database Monitoring             │
│                                                     │
│         ┌─────────┬─────────┐                      │
│         │ Login   │ Register│  (Tabs)              │
│         └─────────┴─────────┘                      │
│                                                     │
│         Username                                    │
│         [                    ]                      │
│                                                     │
│         Password                                    │
│         [                    ]                      │
│                                                     │
│         [    Sign In Button    ]                    │
│                                                     │
│         New user? Create an account                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Colors
- Background: Gradient from blue-50 via white to blue-100
- Card: White with shadow-2xl
- Icon Badge: Gradient from blue-500 to blue-600
- Button: Gradient from blue-600 to blue-700
- Text: Gray-900 for headings, Gray-600 for body

---

## 2. Login Page (Dark Mode)

### Visual Description
```
Same layout as light mode
```

### Colors
- Background: Gradient from gray-900 via gray-800 to blue-900
- Card: Gray-800 with shadow-2xl
- Icon Badge: Gradient from blue-500 to blue-600
- Button: Gradient from blue-600 to blue-700
- Text: White for headings, Gray-400 for body

---

## 3. Main Dashboard - Sidebar (Light Mode)

### Visual Description
```
┌──────────────────┐
│  [Icon] Stream   │
│        Watch     │
│  Monitoring      │
├──────────────────┤
│                  │
│ [Icon] Data Hub  │ ← Active (Blue gradient)
│                  │
│ [Icon] AI        │
│        Analyst   │
│                  │
│ [Icon] System    │
│        Vitals    │
│                  │
├──────────────────┤
│                  │
│ [Icon] Light     │
│        Mode      │
│                  │
│ Signed in as     │
│ username         │
│                  │
│ [Icon] Logout    │
│                  │
└──────────────────┘
```

### Colors
- Background: White
- Border: Gray-200
- Active Item: Gradient blue-500 to blue-600 with shadow
- Inactive Items: Gray-700, hover gray-100
- Theme Toggle: Gray-100 background
- Logout: Red-500 with shadow

---

## 4. Main Dashboard - Sidebar (Dark Mode)

### Visual Description
```
Same layout as light mode
```

### Colors
- Background: Gray-800
- Border: Gray-700
- Active Item: Gradient blue-500 to blue-600 with shadow
- Inactive Items: Gray-300, hover gray-700
- Theme Toggle: Gray-700 background
- Logout: Red-500 with shadow

---

## 5. AI Analyst Page (Light Mode)

### Visual Description
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Icon] AI Analyst                                                       │
│ Natural language database queries with intelligent insights             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────┐  ┌──────────────────────────────┐ │
│ │ [Icon] Ask a Question           │  │ [Icon] Recent Queries  [↻]   │ │
│ │                                 │  │                              │ │
│ │ ┌─────────────────────────────┐ │  │ ┌──────────────────────────┐ │
│ │ │ Example: Show me all        │ │  │ │ Success  10:30 AM        │ │
│ │ │ sensors where temperature   │ │  │ │ Show temperature > 50    │ │
│ │ │ is greater than 50 degrees  │ │  │ └──────────────────────────┘ │
│ │ └─────────────────────────────┘ │  │                              │ │
│ │                                 │  │ ┌──────────────────────────┐ │
│ │ [    Execute Query Button    ]  │  │ │ Blocked  10:25 AM        │ │
│ │                                 │  │ │ drop database            │ │
│ └─────────────────────────────────┘  │ │ Reason: Attempted to...  │ │
│                                      │ └──────────────────────────┘ │
│ ┌─────────────────────────────────┐  │                              │ │
│ │ [Icon] Query Results            │  │ ┌──────────────────────────┐ │
│ │                                 │  │ │ Success  10:20 AM        │ │
│ │ Answer                          │  │ │ Average water level      │ │
│ │ ┌─────────────────────────────┐ │  │ └──────────────────────────┘ │
│ │ │ Found 5 sensors with temp   │ │  │                              │ │
│ │ │ above 50 degrees...         │ │  │ ... (7 more queries)         │ │
│ │ └─────────────────────────────┘ │  │                              │ │
│ │                                 │  └──────────────────────────────┘ │
│ │ Generated Query                 │                                   │
│ │ ┌─────────────────────────────┐ │                                   │
│ │ │ Type: find                  │ │                                   │
│ │ │ {                           │ │                                   │
│ │ │   "filter": {               │ │                                   │
│ │ │     "temperature": {        │ │                                   │
│ │ │       "$gt": 50             │ │                                   │
│ │ │     }                       │ │                                   │
│ │ │   }                         │ │                                   │
│ │ │ }                           │ │                                   │
│ │ └─────────────────────────────┘ │                                   │
│ │                                 │                                   │
│ │ Data (5 records)                │                                   │
│ │ ┌─────────────────────────────┐ │                                   │
│ │ │ [                           │ │                                   │
│ │ │   {                         │ │                                   │
│ │ │     "_id": "...",           │ │                                   │
│ │ │     "temperature": 55,      │ │                                   │
│ │ │     ...                     │ │                                   │
│ │ │   }                         │ │                                   │
│ │ │ ]                           │ │                                   │
│ │ └─────────────────────────────┘ │                                   │
│ └─────────────────────────────────┘                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Colors
- Background: Gray-50
- Header: White with border-b gray-200
- Cards: White with shadow-lg, border gray-200
- Query Input: Gray-50 background
- Execute Button: Gradient blue-500 to blue-600
- Success Badge: Blue-600
- Blocked Badge: Red-600
- Code Block: Gray-900 background, green-400 text
- Data Block: Gray-50 background

---

## 6. AI Analyst Page (Dark Mode)

### Visual Description
```
Same layout as light mode
```

### Colors
- Background: Gray-900
- Header: Gray-800 with border-b gray-700
- Cards: Gray-800 with shadow-lg, border gray-700
- Query Input: Gray-700 background
- Execute Button: Gradient blue-500 to blue-600
- Success Badge: Blue-400
- Blocked Badge: Red-400
- Code Block: Gray-950 background, green-400 text
- Data Block: Gray-700/50 background

---

## 7. Error States

### Blocked Query (Red Alert)
```
┌─────────────────────────────────────────────────┐
│ [!] Query Blocked                               │
│                                                 │
│ Query blocked for security reasons              │
│                                                 │
│ Reason: Attempted to drop database/collection   │
└─────────────────────────────────────────────────┘
```

### Colors (Light Mode)
- Background: Red-50
- Border: Red-200
- Icon: Red-600
- Text: Red-800
- Reason: Red-600

### Colors (Dark Mode)
- Background: Red-900/20
- Border: Red-800
- Icon: Red-400
- Text: Red-300
- Reason: Red-400

---

### Regular Error (Yellow Alert)
```
┌─────────────────────────────────────────────────┐
│ [!] Error                                       │
│                                                 │
│ Failed to process query                         │
└─────────────────────────────────────────────────┘
```

### Colors (Light Mode)
- Background: Yellow-50
- Border: Yellow-200
- Icon: Yellow-600
- Text: Yellow-800

### Colors (Dark Mode)
- Background: Yellow-900/20
- Border: Yellow-800
- Icon: Yellow-400
- Text: Yellow-300

---

## 8. Loading States

### Query Processing
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Spinning Circle]                  │
│                                                 │
│           Processing Query...                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Button Loading
```
┌─────────────────────────────────────────────────┐
│  [Spinner] Processing Query...                  │
└─────────────────────────────────────────────────┘
```

### Colors
- Spinner: Blue-600
- Text: Gray-600 (light) / Gray-300 (dark)

---

## 9. Query History Items

### Successful Query
```
┌──────────────────────────────────────┐
│ Success              10:30 AM        │
│                                      │
│ Show me all sensors where            │
│ temperature is greater than 50       │
└──────────────────────────────────────┘
```

### Colors (Light Mode)
- Background: Gray-50, hover gray-100
- Border: Gray-200
- Badge: Blue-600
- Text: Gray-700
- Time: Gray-500

### Colors (Dark Mode)
- Background: Gray-700/50, hover gray-700
- Border: Gray-600
- Badge: Blue-400
- Text: Gray-300
- Time: Gray-400

---

### Blocked Query
```
┌──────────────────────────────────────┐
│ Blocked              10:25 AM        │
│                                      │
│ drop database streamwatch            │
│                                      │
│ Attempted to drop database/collection│
└──────────────────────────────────────┘
```

### Colors (Light Mode)
- Background: Red-50
- Border: Red-200
- Badge: Red-600
- Text: Gray-700
- Reason: Red-600
- Opacity: 75%
- Cursor: not-allowed

### Colors (Dark Mode)
- Background: Red-900/10
- Border: Red-800
- Badge: Red-400
- Text: Gray-300
- Reason: Red-400
- Opacity: 75%
- Cursor: not-allowed

---

## 10. Theme Toggle Button

### Light Mode (showing dark mode option)
```
┌──────────────────────────────────────┐
│  [Moon Icon]  Dark Mode              │
└──────────────────────────────────────┘
```

### Dark Mode (showing light mode option)
```
┌──────────────────────────────────────┐
│  [Sun Icon]  Light Mode              │
└──────────────────────────────────────┘
```

### Colors
- Background: Gray-100 (light) / Gray-700 (dark)
- Hover: Gray-200 (light) / Gray-600 (dark)
- Text: Gray-700 (light) / Gray-300 (dark)
- Icon: Same as text

---

## 11. Icon Examples

All icons are SVG-based with consistent styling:

### Navigation Icons
- Data Hub: Database icon (stacked cylinders)
- AI Analyst: Light bulb icon
- System Vitals: Bar chart icon

### Action Icons
- Refresh: Circular arrows
- Logout: Arrow pointing right with door
- Theme: Sun (light) / Moon (dark)

### Status Icons
- Success: Checkmark in circle
- Error: Exclamation in triangle
- Blocked: Exclamation in triangle (red)
- Info: Information in circle

### Sizes
- Small: 16px (w-4 h-4)
- Medium: 20px (w-5 h-5)
- Large: 24px (w-6 h-6)
- XLarge: 28px (w-7 h-7)
- Badge: 48px (w-12 h-12)

---

## 12. Responsive Behavior

### Desktop (1024px+)
- Three-column layout for AI Analyst
- Full sidebar visible
- Large cards with generous spacing

### Tablet (768px - 1023px)
- Two-column layout
- Sidebar remains visible
- Medium cards

### Mobile (< 768px)
- Single column layout
- Collapsible sidebar (if implemented)
- Stacked cards
- Touch-friendly buttons (min 44px)

---

## 13. Animation Examples

### Hover Effects
- Buttons: Scale 1.05, shadow increase
- Cards: Shadow increase
- History items: Background color change

### Transitions
- Theme switch: 200ms ease
- Navigation: 200ms ease
- Hover states: 200ms ease

### Loading
- Spinner: Continuous rotation
- Button: Pulse effect

---

## Color Reference Quick Guide

### Light Mode Primary Colors
```
Background: #FFFFFF
Surface: #F9FAFB
Primary: #3B82F6
Text: #111827
Border: #E5E7EB
```

### Dark Mode Primary Colors
```
Background: #111827
Surface: #1F2937
Primary: #3B82F6
Text: #FFFFFF
Border: #374151
```

---

This guide provides a complete visual reference for all screens and states in the Stream Watch application. Use it for documentation, testing, or design consistency checks.
