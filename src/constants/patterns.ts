import { RouteFileType, RoutingPattern } from './types';

// File type patterns for Next.js App Router
export const FILE_PATTERNS = {
  [RouteFileType.Page]: /^page\.(tsx?|jsx?)$/,
  [RouteFileType.Layout]: /^layout\.(tsx?|jsx?)$/,
  [RouteFileType.Loading]: /^loading\.(tsx?|jsx?)$/,
  [RouteFileType.Error]: /^error\.(tsx?|jsx?)$/,
  [RouteFileType.NotFound]: /^not-found\.(tsx?|jsx?)$/,
  [RouteFileType.Route]: /^route\.(ts|js)$/,
  [RouteFileType.Template]: /^template\.(tsx?|jsx?)$/,
  [RouteFileType.Default]: /^default\.(tsx?|jsx?)$/,
  [RouteFileType.GlobalError]: /^global-error\.(tsx?|jsx?)$/,
} as const;

// Route segment patterns
export const SEGMENT_PATTERNS = {
  [RoutingPattern.Static]: /^[^[\]()@]+$/,
  [RoutingPattern.Dynamic]: /^\[([^.\]]+)\]$/,
  [RoutingPattern.CatchAll]: /^\[\.\.\.([^.\]]+)\]$/,
  [RoutingPattern.OptionalCatchAll]: /^\[\[\.\.\.([^.\]]+)\]\]$/,
  [RoutingPattern.RouteGroup]: /^\(([^)]+)\)$/,
  [RoutingPattern.Parallel]: /^@([^/]+)$/,
  [RoutingPattern.Intercepting]: /^(\(.+\))(.*)$/,
} as const;

// Combined patterns for complex matching
export const ROUTE_PATTERNS = {
  // Dynamic segment: [id], [slug], etc.
  DYNAMIC_SEGMENT: /^\[([^.\]]+)\]$/,
  
  // Catch-all: [...slug]
  CATCH_ALL_SEGMENT: /^\[\.\.\.([^.\]]+)\]$/,
  
  // Optional catch-all: [[...slug]]
  OPTIONAL_CATCH_ALL_SEGMENT: /^\[\[\.\.\.([^.\]]+)\]\]$/,
  
  // Route group: (marketing), (auth)
  ROUTE_GROUP: /^\(([^)]+)\)$/,
  
  // Parallel route: @auth, @dashboard
  PARALLEL_ROUTE: /^@([^/]+)$/,
  
  // Intercepting routes: (..), (...), (....)
  INTERCEPTING_ROUTE: /^(\(.+\))(.*)$/,
  
  // App Router file types
  APP_ROUTER_FILE: /^(page|layout|loading|error|not-found|route|template|default|global-error)\.(tsx?|jsx?|ts|js)$/,
  
  // Valid TypeScript/JavaScript file extensions
  VALID_EXTENSIONS: /\.(tsx?|jsx?)$/,
} as const;

// Helper function to get file type from filename
export function getFileType(filename: string): RouteFileType | null {
  for (const [type, pattern] of Object.entries(FILE_PATTERNS)) {
    if (pattern.test(filename)) {
      return type as RouteFileType;
    }
  }
  return null;
}

// Helper function to get routing pattern from segment
export function getRoutingPattern(segment: string): RoutingPattern {
  if (SEGMENT_PATTERNS[RoutingPattern.OptionalCatchAll].test(segment)) {
    return RoutingPattern.OptionalCatchAll;
  }
  if (SEGMENT_PATTERNS[RoutingPattern.CatchAll].test(segment)) {
    return RoutingPattern.CatchAll;
  }
  if (SEGMENT_PATTERNS[RoutingPattern.Dynamic].test(segment)) {
    return RoutingPattern.Dynamic;
  }
  if (SEGMENT_PATTERNS[RoutingPattern.RouteGroup].test(segment)) {
    return RoutingPattern.RouteGroup;
  }
  if (SEGMENT_PATTERNS[RoutingPattern.Parallel].test(segment)) {
    return RoutingPattern.Parallel;
  }
  if (SEGMENT_PATTERNS[RoutingPattern.Intercepting].test(segment)) {
    return RoutingPattern.Intercepting;
  }
  return RoutingPattern.Static;
}

// Next.js App Router reserved filenames
export const RESERVED_FILENAMES = [
  'page',
  'layout',
  'loading',
  'error',
  'not-found',
  'route',
  'template',
  'default',
  'global-error'
] as const;

// Common exclude patterns for file watching
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.*',
  '**/*.spec.*'
] as const;