# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Project Architecture

This is a Next.js 15 application built with React 19, using the App Router architecture for an AI headshot/avatar generation service.

### Key Technologies
- **Next.js 15** with App Router and Turbopack enabled
- **React 19** with TypeScript 5
- **TailwindCSS 4** for styling with shadcn/ui components
- **Lucide React** for icons

### Directory Structure
- `src/app/` - Next.js App Router pages (layout.tsx, page.tsx, globals.css)
  - `src/app/loading/` - Loading page route with 60-second animation experience
- `src/components/` - React components including custom UI and animations
- `src/components/ui/` - shadcn/ui components
- `src/data/` - Static data (testimonials.json)
- `src/lib/` - Utility functions
- `public/` - Static assets including sample photos and icons

### Component Architecture
The app follows a component-based architecture with these key components:

**Landing Page Components:**
- `AnimatedWaveText` - Text animation component with gradient effects
- `InfiniteSlider` - Horizontal scrolling image carousel with directional control
- `TestimonialCard` - User testimonial display with ratings
- `UploadButton` - File upload interface that navigates to loading page
- `MyPictures` - User gallery component
- `EndorsementCard` - Social proof component

**Loading Page Components:**
- `FadingImages` - Cycles through headshot images with smooth fade transitions (4-second intervals)
- `ProgressBar` - 60-second animated progress bar with shine effect and percentage display
- `CyclingText` - Alternates between gimmicky processing messages and user testimonials (3.5-second intervals)

### Styling Approach
- Uses TailwindCSS with custom gradient animations
- shadcn/ui component system with "new-york" style
- CSS variables enabled for theming
- Geist fonts (sans and mono) loaded via next/font
- **Centralized background**: `.app-background` utility class in globals.css for consistent background across all pages
- Custom animations: `animate-shine`, `animate-wave`, `animate-gradient-x` defined in globals.css

### Import Aliases
- `@/*` maps to `src/*`
- `@/components` for components
- `@/lib/utils` for utilities
- `@/data` for static data

The application appears to be a landing page for an AI avatar/headshot generation service with testimonials, image carousels, and upload functionality.