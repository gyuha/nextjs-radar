# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## Project Overview

**Next.js Radar** is a VS Code extension that visualizes and helps navigate Next.js App Router project routing structures. It's based on the successful architecture of Svelte Radar, adapted for Next.js App Router's unique patterns and conventions.

The extension automatically detects Next.js App Router patterns and provides:
- Route tree visualization (hierarchical and flat views)
- Page content navigation within files
- Smart routing pattern support for all Next.js App Router conventions
- URL-based route opening and browser preview integration

## Key Commands

### Development Workflow
```bash
# Install dependencies and setup
npm install

# Development mode (launches VS Code Extension Host)
npm run watch              # Compile and watch for changes
F5                        # Launch extension development host from VS Code

# Testing
npm test                  # Run all tests
npm run compile-tests     # Compile test files
npm run create-test-fixtures  # Generate test fixtures

# Build for production
npm run package          # Build for VS Code Marketplace
npm run vscode:prepublish # Full build with checks

# Code quality
npm run lint             # ESLint
npm run check-types      # TypeScript type checking
```

### VS Code Extension Development
- Press `F5` to launch Extension Development Host with the extension loaded
- Use `Ctrl/Cmd + Shift + P` → "Developer: Reload Window" to reload changes
- Test extension commands via Command Palette in the Extension Development Host

## Architecture

### Core Architecture (Based on Svelte Radar)
```
src/
├── extension.ts              # Extension entry point & command registration
├── constants/
│   ├── types.ts             # TypeScript type definitions
│   └── patterns.ts          # Next.js App Router routing patterns
├── models/
│   ├── routeItem.ts         # Route tree item model
│   └── pageContentItem.ts   # Page content navigation model
├── providers/
│   ├── routesProvider.ts    # Route tree data provider
│   └── pageContentProvider.ts # Page content tree provider
├── utils/
│   ├── routeUtils.ts        # Route pattern matching & normalization
│   ├── fileUtils.ts         # File system operations
│   └── urlUtils.ts          # URL processing utilities
└── test/
    └── **/*.test.ts         # Mocha test files
```

### Next.js App Router File Types to Support

The extension detects these Next.js App Router file patterns:
- `page.tsx/js` - Page components
- `layout.tsx/js` - Layout components  
- `loading.tsx/js` - Loading UI
- `error.tsx/js` - Error pages
- `not-found.tsx/js` - 404 pages
- `route.ts/js` - API routes
- `template.tsx/js` - Template components
- `default.tsx/js` - Default pages (parallel routes)
- `global-error.tsx/js` - Global error handlers

### Routing Patterns to Support

**Static Routes:** `/about`, `/contact`
**Dynamic Segments:** `[id]`, `[slug]` 
**Catch-all Dynamic:** `[...slug]`
**Optional Catch-all:** `[[...slug]]`
**Route Groups:** `(marketing)`, `(auth)`
**Parallel Routes:** `@auth`, `@dashboard`
**Intercepting Routes:** `(..)`, `(...)`, `(....)`

## Configuration

### Extension Activation
The extension activates when detecting:
- `next.config.js` file exists
- `package.json` dependencies include `next`
- `src/app` or `app` directory exists

### Workspace Configuration
Create `.vscode/nextjs-radar.json`:
```json
{
  "projectRoot": "./",           // Project root (monorepo support)
  "appDirectory": "src/app",     // App Router directory
  "port": 3000,                  // Dev server port
  "enablePageContentView": true, // Page content view
  "excludePatterns": [           // Exclusion patterns
    "**/node_modules/**",
    "**/.next/**"
  ]
}
```

### Extension Settings
```json
{
  "nextjsRadar.viewType": "hierarchical",    // Default view type
  "nextjsRadar.sortingType": "natural",      // Sorting method
  "nextjsRadar.showFileExtensions": false,   // Show extensions
  "nextjsRadar.groupByType": true            // Group by file type
}
```

## Key Implementation Notes

### Pattern Matching Strategy
Based on Svelte Radar's `routeUtils.ts` approach:
- Use glob patterns to find App Router files
- Normalize route paths for display (convert `[id]` to `:id`)
- Support natural sorting for numbered routes
- Handle Next.js-specific patterns (route groups, parallel routes)

### Tree View Implementation
Follow Svelte Radar's proven patterns:
- `RouteItem` extends `vscode.TreeItem` for tree nodes
- Providers implement `vscode.TreeDataProvider`
- Support both flat and hierarchical views
- Context menu actions for navigation and preview

### File Detection Logic
Adapt from `routesProvider.ts` pattern:
1. Watch for file system changes in app directory
2. Parse directory structure for App Router patterns
3. Classify files by type (`page`, `layout`, `api`, etc.)
4. Build tree structure respecting Next.js conventions

### Icon System
Create icon mappings for Next.js file types:
- 📄 `page.tsx` - Page (green)
- 🔧 `layout.tsx` - Layout (purple)
- ⏳ `loading.tsx` - Loading (yellow)
- ❌ `error.tsx` - Error (red)
- 🌐 `route.ts` - API (orange)
- 📁 `(group)` - Route Group (orange)
- ⚡ `@parallel` - Parallel Route (blue)

### URL Routing Feature
Implement the "Open Route" command similar to Svelte Radar:
- Accept URL input (`http://localhost:3000/dashboard/profile`)
- Parse URL to match against App Router file structure
- Handle dynamic segments and route matching
- Open corresponding file in editor

## Development Workflow

### Setting Up Development Environment
1. Reference `svelte-radar/CONTRIBUTING.md` for setup patterns
2. Install Node.js LTS and VS Code
3. Clone and `npm install`
4. Use `F5` for extension development host testing

### Testing Strategy
Follow Svelte Radar test patterns:
- Unit tests for route pattern matching
- Integration tests for file detection
- VS Code Extension Test Suite for UI testing
- Mock workspace fixtures for testing different project structures

### Build and Package
- Use `esbuild` for fast compilation (following Svelte Radar)
- TypeScript with strict type checking
- ESLint for code quality
- Production build optimizes for marketplace distribution

## Performance Considerations

### Optimization Strategies (From Svelte Radar Experience)
- File watcher efficiency: only rebuild tree on relevant changes
- Lazy loading for large projects
- Memoization for route pattern calculations
- Virtual scrolling support for massive route structures

### Memory Management
- Dispose file watchers properly
- Reuse tree nodes where possible
- Efficient state management with VS Code API patterns

## Extension Publishing

### VS Code Marketplace Setup
- Extension ID: `nextjs-radar`
- Categories: Programming Languages, Visualization
- Keywords: nextjs, app-router, routes, navigation, developer-tools
- Require VS Code 1.60.0+

### Documentation Requirements
- Comprehensive README with GIFs demonstrating features
- CHANGELOG following semver practices
- Clear usage examples for all supported Next.js patterns

## Testing Against Next.js Projects

### Test Projects Structure
Create test fixtures covering:
- Simple Next.js 13+ App Router projects
- Complex routing with all pattern types
- Monorepo configurations
- Different `app` directory locations (src/app vs app)

### Integration Testing
- Test against real Next.js projects
- Verify route detection accuracy
- Test performance with large codebases
- Validate VS Code extension lifecycle

## Browser Integration

### Development Server Integration
- Detect Next.js dev server port (default 3000)
- Open routes in browser via context menu
- Handle localhost URL generation
- Support custom port configuration

This architecture leverages the proven success of Svelte Radar while adapting specifically for Next.js App Router's routing conventions and file structure patterns.