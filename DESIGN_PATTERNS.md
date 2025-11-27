# Design Patterns & Style Guide

## Glassmorphism Components

### Card/Panel
```jsx
<div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
  {/* Content */}
</div>
```

### Card with Hover Effect
```jsx
<div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 hover:border-fuchsia-500/50 transition-all">
  {/* Content */}
</div>
```

### Gradient Card
```jsx
<div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
  {/* Content */}
</div>
```

## Buttons

### Primary Button
```jsx
<button className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 hover:from-fuchsia-600/30 hover:to-pink-600/30 border border-fuchsia-500/30 rounded-xl transition-all backdrop-blur-xl flex items-center gap-2 text-fuchsia-300 hover:text-fuchsia-200">
  <svg className="w-5 h-5">{/* Icon */}</svg>
  <span className="text-sm font-medium">Button Text</span>
</button>
```

### Danger Button
```jsx
<button className="px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 border border-red-500/30 rounded-xl transition-all backdrop-blur-xl flex items-center space-x-2 text-red-400 hover:text-red-300">
  <svg className="w-5 h-5">{/* Icon */}</svg>
  <span className="text-sm font-medium">Button Text</span>
</button>
```

### Icon Button with Rotation
```jsx
<button className="group relative px-5 py-2.5 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 hover:from-fuchsia-600/30 hover:to-pink-600/30 border border-fuchsia-500/30 rounded-xl transition-all backdrop-blur-xl flex items-center gap-2 text-fuchsia-300 hover:text-fuchsia-200">
  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500">{/* Icon */}</svg>
  <span className="text-sm font-medium">Refresh</span>
</button>
```

## Typography

### Page Title
```jsx
<h1 className="text-3xl font-bold text-white tracking-tight">Page Title</h1>
```

### Subtitle
```jsx
<p className="text-slate-400 mt-1">Subtitle or description text</p>
```

### Section Heading
```jsx
<h2 className="text-xl font-semibold text-white mb-4 flex items-center">
  <svg className="w-6 h-6 mr-2 text-fuchsia-400">{/* Icon */}</svg>
  Section Title
</h2>
```

### Label
```jsx
<label className="block text-sm font-medium text-slate-300 mb-2">
  Label Text
</label>
```

## Form Elements

### Input Field
```jsx
<input
  type="text"
  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none bg-slate-800/50 text-white placeholder-slate-500 backdrop-blur-xl"
  placeholder="Enter text..."
/>
```

### Textarea
```jsx
<textarea
  className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none resize-none bg-slate-800/50 text-white placeholder-slate-500 backdrop-blur-xl"
  rows="4"
  placeholder="Enter text..."
/>
```

## Tables

### Table Container
```jsx
<div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      {/* Table content */}
    </table>
  </div>
</div>
```

### Table Header
```jsx
<thead className="bg-slate-800/50 border-b border-slate-700/50">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
      Column Name
    </th>
  </tr>
</thead>
```

### Table Row
```jsx
<tbody className="divide-y divide-slate-700/30">
  <tr className="hover:bg-slate-800/30 transition-colors">
    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
      Cell Content
    </td>
  </tr>
</tbody>
```

## Stat Cards

### Basic Stat Card
```jsx
<div className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
  <div className="relative">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-400">{/* Icon */}</svg>
      </div>
      <span className="text-sm font-medium text-slate-400">Stat Label</span>
    </div>
    <div className="text-4xl font-bold text-white">123</div>
  </div>
</div>
```

## Alerts/Notifications

### Error Alert
```jsx
<div className="backdrop-blur-xl bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
  Error message here
</div>
```

### Success Alert
```jsx
<div className="backdrop-blur-xl bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl">
  Success message here
</div>
```

### Warning Alert
```jsx
<div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl">
  Warning message here
</div>
```

### Info Alert
```jsx
<div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 px-4 py-3 rounded-xl">
  Info message here
</div>
```

## Code Blocks

### Syntax Highlighted Code
```jsx
<div className="p-4 bg-black/50 border border-slate-700/50 rounded-xl overflow-x-auto">
  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
    {code}
  </pre>
</div>
```

## Loading States

### Spinner
```jsx
<div className="flex items-center justify-center py-12">
  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
</div>
```

### Loading Text
```jsx
<div className="text-center py-12">
  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
  <p className="mt-4 text-slate-400">Loading...</p>
</div>
```

## Navigation

### Top Nav Item (Active)
```jsx
<Link
  to="/path"
  className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 text-white border border-fuchsia-500/30"
>
  <div className="transition-transform scale-110">
    <svg className="w-5 h-5">{/* Icon */}</svg>
  </div>
  <span className="text-sm font-medium">Nav Item</span>
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full" />
</Link>
```

### Top Nav Item (Inactive)
```jsx
<Link
  to="/path"
  className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-slate-800/50"
>
  <div className="transition-transform group-hover:scale-110">
    <svg className="w-5 h-5">{/* Icon */}</svg>
  </div>
  <span className="text-sm font-medium">Nav Item</span>
</Link>
```

## Badges

### Role Badge (Admin)
```jsx
<span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
  admin
</span>
```

### Role Badge (User)
```jsx
<span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
  user
</span>
```

### Status Badge (Success)
```jsx
<span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-500/20 border border-green-500/30 text-green-400">
  Success
</span>
```

### Status Badge (Error)
```jsx
<span className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/20 border border-red-500/30 text-red-400">
  Error
</span>
```

## Scrollbar Styling

Add to your CSS:
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(236, 72, 153, 0.5);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(236, 72, 153, 0.7);
}
```

## Color Palette

### Primary Colors
- Fuchsia: `#EC4899` (fuchsia-500)
- Pink: `#D946EF` (pink-500)
- Purple: `#A855F7` (purple-500)

### Background Colors
- Black: `#000000`
- Slate-950: `#020617`
- Slate-900: `#0F172A`
- Slate-800: `#1E293B`

### Text Colors
- White: `#FFFFFF`
- Slate-300: `#CBD5E1`
- Slate-400: `#94A3B8`
- Slate-500: `#64748B`

### Border Colors
- Slate-700/50: `rgba(51, 65, 85, 0.5)`
- Fuchsia-500/30: `rgba(236, 72, 153, 0.3)`

## Animation Classes

### Pulse Animation
```jsx
<div className="animate-pulse">
  {/* Content */}
</div>
```

### Spin Animation
```jsx
<div className="animate-spin">
  {/* Content */}
</div>
```

### Custom Gradient Animation
```jsx
<div className="animate-gradient">
  {/* Content */}
</div>
```

Add to CSS:
```css
@keyframes gradient-shift {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.animate-gradient {
  animation: gradient-shift 8s ease-in-out infinite;
}
```

---

Use these patterns consistently across your application for a cohesive, modern design!
