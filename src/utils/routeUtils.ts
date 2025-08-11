import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { 
  RouteFileType, 
  RoutingPattern, 
  NextjsRouteItem,
  getFileType,
  getRoutingPattern,
  ROUTE_PATTERNS,
  FILE_PATTERNS,
  RESERVED_FILENAMES
} from '../constants';
import { RouteItem } from '../models';

export interface AppRouterFile {
  filePath: string;
  relativePath: string;
  fileName: string;
  fileType: RouteFileType;
  segments: string[];
  routePath: string;
}

/**
 * Find Next.js app directory in the workspace
 */
export async function findNextjsAppDir(workspaceRoot: string): Promise<string | null> {
  const possiblePaths = [
    path.join(workspaceRoot, 'app'),
    path.join(workspaceRoot, 'src', 'app')
  ];

  for (const appPath of possiblePaths) {
    try {
      const stat = await fs.promises.stat(appPath);
      if (stat.isDirectory()) {
        return appPath;
      }
    } catch (error) {
      // Directory doesn't exist, continue
    }
  }

  return null;
}

/**
 * Scan app router files using glob patterns
 */
export async function scanAppRouterFiles(appDir: string): Promise<AppRouterFile[]> {
  const files: AppRouterFile[] = [];
  
  try {
    await scanDirectory(appDir, appDir, files);
  } catch (error) {
    console.error('Error scanning app router files:', error);
  }

  return files;
}

/**
 * Recursively scan directory for Next.js App Router files
 */
async function scanDirectory(currentDir: string, appRoot: string, files: AppRouterFile[]): Promise<void> {
  try {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other common exclude patterns
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }
        
        await scanDirectory(fullPath, appRoot, files);
      } else if (entry.isFile()) {
        const fileType = getFileType(entry.name);
        
        if (fileType) {
          const relativePath = path.relative(appRoot, fullPath);
          const segments = parseRouteSegments(relativePath);
          const routePath = buildRoutePath(segments);
          
          files.push({
            filePath: fullPath,
            relativePath,
            fileName: entry.name,
            fileType,
            segments,
            routePath
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${currentDir}:`, error);
  }
}

/**
 * Check if directory should be skipped during scanning
 */
function shouldSkipDirectory(dirName: string): boolean {
  const skipPatterns = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '__tests__',
    '__test__'
  ];
  
  return skipPatterns.includes(dirName) || dirName.startsWith('.');
}

/**
 * Parse route segments from file path
 */
export function parseRouteSegments(relativePath: string): string[] {
  // Remove file name, keep only directory structure
  const dirPath = path.dirname(relativePath);
  
  // Handle root case
  if (dirPath === '.') {
    return [];
  }
  
  // Split path and filter empty segments
  return dirPath.split(path.sep).filter(segment => segment && segment !== '.');
}

/**
 * Build route path from segments
 */
function buildRoutePath(segments: string[]): string {
  if (segments.length === 0) {
    return '/';
  }
  
  const pathSegments = segments
    .filter(segment => !isRouteGroup(segment)) // Remove route groups from URL path
    .map(segment => {
      // Convert dynamic segments for display
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const inner = segment.slice(1, -1);
        if (inner.startsWith('...')) {
          return `*${inner.slice(3)}`; // [...slug] -> *slug
        }
        return `:${inner}`; // [id] -> :id
      }
      
      // Handle parallel routes (remove @ prefix)
      if (segment.startsWith('@')) {
        return segment.slice(1);
      }
      
      return segment;
    });
    
  return '/' + pathSegments.join('/');
}

/**
 * Identify routing pattern for a segment
 */
export function identifyRoutePattern(segment: string): RoutingPattern {
  return getRoutingPattern(segment);
}

/**
 * Build route hierarchy from scanned files
 */
export function buildRouteHierarchy(files: AppRouterFile[]): RouteItem[] {
  const routeMap = new Map<string, RouteItem>();
  const rootRoutes: RouteItem[] = [];

  // Sort files by depth (root files first)
  const sortedFiles = files.sort((a, b) => a.segments.length - b.segments.length);

  for (const file of sortedFiles) {
    const routeId = generateRouteId(file.segments, file.fileType);
    
    // Find parent route
    const parentId = findParentRouteId(file.segments, file.fileType, routeMap);
    
    const routeItem = createRouteItem(file, routeId, parentId);
    routeMap.set(routeId, routeItem);
    
    if (parentId) {
      const parent = routeMap.get(parentId);
      if (parent && parent.canHaveChildren()) {
        parent.addChild(routeItem);
      } else {
        rootRoutes.push(routeItem);
      }
    } else {
      rootRoutes.push(routeItem);
    }
  }

  return rootRoutes;
}

/**
 * Create RouteItem from AppRouterFile
 */
function createRouteItem(file: AppRouterFile, routeId: string, parentId?: string): RouteItem {
  const pattern = determineOverallPattern(file.segments);
  const label = generateRouteLabel(file.segments, file.fileType);
  
  return new RouteItem(
    routeId,
    label,
    file.routePath,
    file.filePath,
    file.fileType,
    pattern,
    file.segments,
    parentId
  );
}

/**
 * Generate unique route ID
 */
function generateRouteId(segments: string[], fileType: RouteFileType): string {
  const pathPart = segments.length > 0 ? segments.join('/') : 'root';
  return `${pathPart}-${fileType}`;
}

/**
 * Generate display label for route
 */
function generateRouteLabel(segments: string[], fileType: RouteFileType): string {
  if (segments.length === 0) {
    return fileType === RouteFileType.Page ? '/' : `/${fileType}`;
  }
  
  const lastSegment = segments[segments.length - 1];
  
  // For non-page files, show the file type
  if (fileType !== RouteFileType.Page) {
    return `${lastSegment}/${fileType}`;
  }
  
  return formatSegmentForDisplay(lastSegment);
}

/**
 * Format segment for display (convert dynamic segments)
 */
function formatSegmentForDisplay(segment: string): string {
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const inner = segment.slice(1, -1);
    if (inner.startsWith('...')) {
      return `[...${inner.slice(3)}]`; // [...slug]
    }
    return `[${inner}]`; // [id]
  }
  
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return `(${segment.slice(1, -1)})`; // (group)
  }
  
  if (segment.startsWith('@')) {
    return `@${segment.slice(1)}`; // @parallel
  }
  
  return segment;
}

/**
 * Find parent route ID for hierarchical organization
 */
function findParentRouteId(
  segments: string[], 
  fileType: RouteFileType, 
  routeMap: Map<string, RouteItem>
): string | undefined {
  if (segments.length === 0) {
    return undefined;
  }
  
  // Look for layout in the same directory first
  const layoutId = generateRouteId(segments, RouteFileType.Layout);
  if (routeMap.has(layoutId)) {
    return layoutId;
  }
  
  // Look for parent layout
  const parentSegments = segments.slice(0, -1);
  if (parentSegments.length > 0) {
    const parentLayoutId = generateRouteId(parentSegments, RouteFileType.Layout);
    if (routeMap.has(parentLayoutId)) {
      return parentLayoutId;
    }
  }
  
  return undefined;
}

/**
 * Determine overall routing pattern for a route
 */
function determineOverallPattern(segments: string[]): RoutingPattern {
  for (const segment of segments) {
    const pattern = getRoutingPattern(segment);
    if (pattern !== RoutingPattern.Static) {
      return pattern;
    }
  }
  return RoutingPattern.Static;
}

/**
 * Match URL to route file
 */
export function matchUrlToRoute(url: string, routes: RouteItem[]): RouteItem | null {
  // Clean up URL - remove query params, hash, leading/trailing slashes
  const cleanPath = cleanUrl(url);
  const urlSegments = cleanPath === '/' ? [] : cleanPath.split('/');
  
  return findMatchingRoute(urlSegments, routes);
}

/**
 * Clean URL for matching
 */
function cleanUrl(url: string): string {
  // Remove protocol and domain if present
  let path = url.includes('://') ? new URL(url).pathname : url;
  
  // Remove query params and hash
  path = path.split('?')[0].split('#')[0];
  
  // Normalize slashes
  path = path.replace(/\/+/g, '/');
  
  // Remove trailing slash unless it's root
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  
  return path;
}

/**
 * Find matching route for URL segments
 */
function findMatchingRoute(urlSegments: string[], routes: RouteItem[]): RouteItem | null {
  for (const route of routes) {
    if (isRouteMatch(urlSegments, route)) {
      return route;
    }
    
    // Check children recursively
    if (route.children) {
      const childMatch = findMatchingRoute(urlSegments, route.children);
      if (childMatch) {
        return childMatch;
      }
    }
  }
  
  return null;
}

/**
 * Check if route matches URL segments
 */
function isRouteMatch(urlSegments: string[], route: RouteItem): boolean {
  // Only match page routes for URLs
  if (!route.isPage) {
    return false;
  }
  
  const routeSegments = route.segments.filter(segment => !isRouteGroup(segment));
  
  // Handle root route
  if (routeSegments.length === 0) {
    return urlSegments.length === 0;
  }
  
  return matchSegments(urlSegments, routeSegments);
}

/**
 * Match URL segments against route segments
 */
function matchSegments(urlSegments: string[], routeSegments: string[]): boolean {
  let urlIndex = 0;
  let routeIndex = 0;
  
  while (routeIndex < routeSegments.length) {
    const routeSegment = routeSegments[routeIndex];
    
    if (isOptionalCatchAllSegment(routeSegment)) {
      // Optional catch-all matches any remaining segments or none
      return true;
    }
    
    if (isCatchAllSegment(routeSegment)) {
      // Catch-all must match at least one segment
      return urlIndex < urlSegments.length;
    }
    
    if (isDynamicSegment(routeSegment)) {
      // Dynamic segment matches any single segment
      if (urlIndex >= urlSegments.length) {
        return false;
      }
      urlIndex++;
    } else if (routeSegment.startsWith('@')) {
      // Skip parallel routes in matching
      // They don't affect URL structure
    } else {
      // Static segment must match exactly
      if (urlIndex >= urlSegments.length || urlSegments[urlIndex] !== routeSegment) {
        return false;
      }
      urlIndex++;
    }
    
    routeIndex++;
  }
  
  // All route segments matched, URL should be fully consumed
  return urlIndex === urlSegments.length;
}

/**
 * Helper functions for route pattern detection
 */
export function isRouteGroup(segment: string): boolean {
  return ROUTE_PATTERNS.ROUTE_GROUP.test(segment);
}

export function isDynamicSegment(segment: string): boolean {
  return ROUTE_PATTERNS.DYNAMIC_SEGMENT.test(segment);
}

export function isCatchAllSegment(segment: string): boolean {
  return ROUTE_PATTERNS.CATCH_ALL_SEGMENT.test(segment);
}

export function isOptionalCatchAllSegment(segment: string): boolean {
  return ROUTE_PATTERNS.OPTIONAL_CATCH_ALL_SEGMENT.test(segment);
}

export function isParallelRoute(segment: string): boolean {
  return ROUTE_PATTERNS.PARALLEL_ROUTE.test(segment);
}

export function isInterceptingRoute(segment: string): boolean {
  return ROUTE_PATTERNS.INTERCEPTING_ROUTE.test(segment);
}

/**
 * Get route depth for sorting
 */
export function getRouteDepth(route: RouteItem): number {
  return route.segments.length;
}

/**
 * Sort routes naturally (handling numbered segments correctly)
 */
export function sortRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.sort((a, b) => {
    // First sort by depth
    const depthDiff = getRouteDepth(a) - getRouteDepth(b);
    if (depthDiff !== 0) {
      return depthDiff;
    }
    
    // Then sort by path using natural sort
    return naturalSort(a.path, b.path);
  });
}

/**
 * Natural sort for route paths (handles numbers correctly)
 */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, {
    numeric: true,
    caseFirst: 'lower'
  });
}

/**
 * Check if workspace is a Next.js project
 */
export async function isNextjsProject(workspaceRoot: string): Promise<boolean> {
  try {
    // Check for next.config.js
    const nextConfigPath = path.join(workspaceRoot, 'next.config.js');
    if (await fileExists(nextConfigPath)) {
      return true;
    }

    // Check for next.config.mjs
    const nextConfigMjsPath = path.join(workspaceRoot, 'next.config.mjs');
    if (await fileExists(nextConfigMjsPath)) {
      return true;
    }

    // Check package.json for next dependency
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (dependencies.next) {
        return true;
      }
    }

    // Check for app directory
    const appDir = await findNextjsAppDir(workspaceRoot);
    return appDir !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}