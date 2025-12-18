# Mobile Optimization Guide

## Overview
This document outlines the comprehensive mobile optimizations implemented in TTM Vision for better performance and user experience on mobile devices.

## Performance Optimizations

### 1. CSS Performance
- **Touch optimization**: Removed tap highlights and improved touch interactions
- **Smooth scrolling**: `-webkit-overflow-scrolling: touch` for iOS momentum scrolling
- **Safe areas**: Support for iPhone notch and Android navigation bars
- **Text size**: Prevented automatic text size adjustment on mobile browsers
- **Touch targets**: Minimum 44x44px touch areas for better accessibility

### 2. React Performance
- **Optimized re-renders**: Memoized components where appropriate
- **Lazy loading**: Components load only when needed
- **Code splitting**: Optimized package imports for smaller bundles

### 3. Next.js Configuration
- **Image optimization**: AVIF/WebP formats with responsive sizes
- **Compression**: Enabled Gzip/Brotli compression
- **Package imports**: Optimized lucide-react and UI components
- **Cache TTL**: Set minimum cache time for images

### 4. Viewport & Meta Tags
- **Theme color**: Adaptive based on system preference
- **Viewport fit**: Cover mode for notched devices
- **PWA support**: Optimized for installation as app
- **Scalable**: Allow up to 5x zoom for accessibility

## Mobile-Specific Components

### MobileJobCard
- **Card-based layout**: Easier to tap and scan
- **Condensed information**: Shows key details at a glance
- **Touch-friendly actions**: Large tap targets for dropdowns
- **Active states**: Visual feedback on touch
- **Line clamping**: Prevents text overflow

### Mobile-Optimized Table
- **Adaptive views**: Cards on mobile, tables on desktop
- **Responsive text**: Smaller fonts on mobile
- **Hidden columns**: Non-essential info hidden on small screens
- **Horizontal scroll**: Where necessary with momentum

### Responsive Header
- **Compact mode**: Reduced height and padding on mobile
- **Icon-only buttons**: Text hidden on small screens
- **Truncated text**: Prevents layout breaking
- **Sticky positioning**: Always accessible

## Hooks for Mobile Detection

### useIsMobile()
```typescript
const isMobile = useIsMobile(); // true on screens < 768px
```

### useIsTouchDevice()
```typescript
const isTouch = useIsTouchDevice(); // true on touch-enabled devices
```

### useDevicePixelRatio()
```typescript
const dpr = useDevicePixelRatio(); // for optimizing images
```

## UI/UX Improvements

### Touch Interactions
- Minimum 44x44px touch targets (Apple guidelines)
- Active state feedback on all touchable elements
- Prevented double-tap zoom where not needed
- Improved gesture support

### Typography
- Prevented text size adjustment
- Used relative units (rem) for better scaling
- Optimized line heights for readability
- Proper contrast ratios

### Layout
- Mobile-first responsive design
- Flexible grid system
- Stack layouts on small screens
- Safe area insets for notched devices

### Navigation
- Hamburger menu on mobile
- Bottom navigation option ready
- Swipe gestures supported
- Back button behavior optimized

## Performance Metrics

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Mobile-Specific
- **Touch response time**: < 100ms
- **Scroll performance**: 60fps
- **Bundle size**: Optimized with code splitting
- **Image loading**: Progressive with lazy loading

## Best Practices

### When Adding New Features
1. **Always test on real devices** (not just browser dev tools)
2. **Use mobile-first approach** (start with mobile, enhance for desktop)
3. **Touch targets**: Minimum 44x44px
4. **Performance**: Check bundle size impact
5. **Images**: Always use Next.js Image component
6. **Text**: Ensure readable at 16px base size
7. **Loading states**: Show skeleton loaders
8. **Offline support**: Handle network errors gracefully

### Responsive Breakpoints
```css
sm:  640px  /* Landscape phones */
md:  768px  /* Tablets */
lg:  1024px /* Small laptops */
xl:  1280px /* Desktops */
2xl: 1536px /* Large screens */
```

### Component Pattern
```tsx
const isMobile = useIsMobile();

return isMobile ? (
  <MobileOptimizedView />
) : (
  <DesktopView />
);
```

## Testing Checklist

### Devices to Test
- [ ] iPhone 12/13/14 (iOS Safari)
- [ ] iPhone SE (small screen)
- [ ] Android phone (Chrome)
- [ ] iPad (tablet view)
- [ ] Various screen sizes in dev tools

### Scenarios to Test
- [ ] Portrait and landscape orientations
- [ ] Touch interactions (tap, swipe, pinch)
- [ ] Keyboard visibility (forms)
- [ ] Slow 3G network
- [ ] Offline mode
- [ ] PWA installation
- [ ] Safe area insets (notched devices)

## Common Issues & Solutions

### Issue: Text too small on mobile
**Solution**: Use relative units (rem/em) instead of fixed px

### Issue: Buttons hard to tap
**Solution**: Ensure minimum 44x44px touch target with padding

### Issue: Layout shifts on load
**Solution**: Use skeleton loaders and reserve space

### Issue: Slow page loads
**Solution**: Implement code splitting and lazy loading

### Issue: Images loading slowly
**Solution**: Use Next.js Image with priority prop for above-fold images

### Issue: Horizontal scroll on mobile
**Solution**: Use `overflow-x-hidden` and responsive units

## Future Enhancements

- [ ] Service worker for offline support
- [ ] Push notifications
- [ ] Background sync
- [ ] Share API integration
- [ ] Geolocation for automatic address fill
- [ ] Camera integration for site photos
- [ ] Biometric authentication
- [ ] Dark mode auto-switching
- [ ] Haptic feedback

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Mobile-First Design](https://www.nngroup.com/articles/mobile-first-not-mobile-only/)
- [Touch Target Sizes](https://www.nngroup.com/articles/touch-target-size/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
