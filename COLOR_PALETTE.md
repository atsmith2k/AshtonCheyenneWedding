# Wedding Application Color Palette

## Overview
The application has been updated to use a sophisticated, elegant color palette consisting of five carefully selected colors that create a harmonious and romantic aesthetic perfect for a wedding website.

## Color Palette

### Primary Colors

| Color Name | Hex | HSL | RGB | Usage |
|------------|-----|-----|-----|-------|
| **Silver** | `#b5b1b2` | `hsla(345, 3%, 70%, 1)` | `rgba(181, 177, 178, 1)` | Neutral backgrounds, muted elements |
| **Rose Quartz** | `#ada9b7` | `hsla(257, 9%, 69%, 1)` | `rgba(173, 169, 183, 1)` | Secondary/complementary color |
| **Periwinkle** | `#a9afd1` | `hsla(231, 30%, 74%, 1)` | `rgba(169, 175, 209, 1)` | Primary brand color |
| **Light Sky Blue** | `#a1cdf4` | `hsla(208, 79%, 79%, 1)` | `rgba(161, 205, 244, 1)` | Accent color, highlights |
| **Cool Gray** | `#7c809b` | `hsla(232, 13%, 55%, 1)` | `rgba(124, 128, 155, 1)` | Text, foreground elements |

## Semantic Color Mapping

The colors are mapped to semantic roles in the design system:

- **Primary**: Periwinkle - Main brand color for buttons, links, and key elements
- **Secondary**: Rose Quartz - Complementary color for secondary actions
- **Accent**: Light Sky Blue - Highlights, hover states, and call-to-action elements
- **Muted**: Silver - Background colors, subtle elements
- **Foreground**: Cool Gray - Text and foreground elements

## CSS Custom Properties

### Direct Color Access
```css
:root {
  --silver: #b5b1b2;
  --rose-quartz: #ada9b7;
  --periwinkle: #a9afd1;
  --light-sky-blue: #a1cdf4;
  --cool-gray: #7c809b;
}
```

### Semantic Colors (HSL format for better manipulation)
```css
:root {
  --primary: 231 30% 74%;        /* Periwinkle */
  --secondary: 257 9% 69%;       /* Rose Quartz */
  --accent: 208 79% 79%;         /* Light Sky Blue */
  --muted: 345 3% 70%;           /* Silver */
  --foreground: 232 13% 35%;     /* Darker Cool Gray */
}
```

## Gradient Utilities

### Pre-built Gradient Classes
```css
.gradient-top          /* 0deg gradient */
.gradient-right        /* 90deg gradient */
.gradient-bottom       /* 180deg gradient */
.gradient-left         /* 270deg gradient */
.gradient-top-right    /* 45deg gradient */
.gradient-bottom-right /* 135deg gradient */
.gradient-top-left     /* 225deg gradient */
.gradient-bottom-left  /* 315deg gradient */
.gradient-radial       /* Radial gradient */
```

### Custom Gradient Classes
```css
.gradient-full    /* Full color spectrum gradient */
.gradient-subtle  /* Subtle transparent gradient */
```

## Tailwind CSS Integration

### Extended Color Palette
The Tailwind config includes extended color scales for each color:

```javascript
wedding: {
  silver: { 50: '#f8f7f7', 400: '#b5b1b2', 900: '#504c4d' },
  'rose-quartz': { 50: '#f7f6f8', 400: '#ada9b7', 900: '#4c474f' },
  periwinkle: { 50: '#f4f5f9', 400: '#a9afd1', 900: '#494e6e' },
  'light-sky-blue': { 50: '#f0f8fe', 400: '#a1cdf4', 900: '#316186' },
  'cool-gray': { 50: '#f4f4f6', 500: '#7c809b', 900: '#434450' }
}
```

### Usage Examples
```html
<!-- Using Tailwind wedding colors -->
<div class="bg-wedding-periwinkle-400 text-white">Primary Button</div>
<div class="bg-wedding-silver-100 text-wedding-cool-gray-800">Subtle Background</div>

<!-- Using semantic colors -->
<div class="bg-primary text-primary-foreground">Primary Element</div>
<div class="bg-secondary text-secondary-foreground">Secondary Element</div>

<!-- Using direct color utilities -->
<div class="bg-periwinkle text-white">Direct Color Usage</div>
```

## Button Variants

### Updated Button Styles
```typescript
wedding: "bg-gradient-to-r from-wedding-periwinkle-400 to-wedding-light-sky-blue-400 text-white"
elegant: "bg-wedding-silver-400 text-wedding-cool-gray-800"
romantic: "bg-gradient-to-r from-wedding-rose-quartz-400 to-wedding-periwinkle-400 text-white"
dreamy: "bg-gradient-to-r from-wedding-light-sky-blue-300 to-wedding-periwinkle-300"
```

## Dark Mode Support

The color palette includes dark mode variants with adjusted brightness and contrast for optimal readability in dark environments.

## Best Practices

1. **Use semantic colors** (`primary`, `secondary`, etc.) for consistent theming
2. **Use wedding color scales** for custom components that need specific shades
3. **Use gradient classes** for decorative elements and hero sections
4. **Test contrast ratios** to ensure accessibility compliance
5. **Use HSL format** in CSS custom properties for easier color manipulation

## Migration Notes

- All existing components using the old color palette have been updated
- Semantic color mappings ensure existing components continue to work
- New gradient utilities provide enhanced visual options
- Tailwind config includes comprehensive color scales for flexibility
