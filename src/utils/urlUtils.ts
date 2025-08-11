import * as vscode from 'vscode';

/**
 * URL utilities for Next.js radar extension
 */

export interface ParsedUrl {
  protocol?: string;
  host?: string;
  port?: number;
  pathname: string;
  search?: string;
  hash?: string;
}

/**
 * Parse URL into components
 */
export function parseUrl(url: string): ParsedUrl {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol.slice(0, -1), // Remove trailing ':'
      host: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : undefined,
      pathname: urlObj.pathname,
      search: urlObj.search || undefined,
      hash: urlObj.hash || undefined
    };
  } catch (error) {
    // Assume it's a pathname only
    return {
      pathname: url.startsWith('/') ? url : `/${url}`
    };
  }
}

/**
 * Build URL from components
 */
export function buildUrl(components: ParsedUrl): string {
  let url = '';
  
  if (components.protocol && components.host) {
    url += `${components.protocol}://${components.host}`;
    
    if (components.port) {
      url += `:${components.port}`;
    }
  }
  
  url += components.pathname;
  
  if (components.search) {
    url += components.search;
  }
  
  if (components.hash) {
    url += components.hash;
  }
  
  return url;
}

/**
 * Normalize pathname by removing trailing slashes and ensuring leading slash
 */
export function normalizePathname(pathname: string): string {
  // Ensure starts with slash
  let normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  
  // Remove trailing slash unless it's root
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Join URL paths correctly
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .filter(path => path && path !== '/')
    .map(path => path.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
    .join('/')
    .replace(/\/+/g, '/'); // Remove duplicate slashes
}

/**
 * Extract pathname from URL
 */
export function extractPathname(url: string): string {
  const parsed = parseUrl(url);
  return normalizePathname(parsed.pathname);
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL is localhost
 */
export function isLocalhost(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Get default Next.js development URL
 */
export function getDefaultNextjsUrl(port: number = 3000): string {
  return `http://localhost:${port}`;
}

/**
 * Build Next.js route URL
 */
export function buildRouteUrl(routePath: string, baseUrl?: string, port?: number): string {
  const base = baseUrl || getDefaultNextjsUrl(port);
  const normalizedPath = normalizePathname(routePath);
  
  return `${base}${normalizedPath}`;
}

/**
 * Open URL in browser
 */
export async function openInBrowser(url: string): Promise<void> {
  try {
    await vscode.env.openExternal(vscode.Uri.parse(url));
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open URL: ${error}`);
  }
}

/**
 * Copy URL to clipboard
 */
export async function copyUrlToClipboard(url: string): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(url);
    vscode.window.showInformationMessage('URL copied to clipboard');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to copy URL: ${error}`);
  }
}

/**
 * Validate Next.js route path
 */
export function isValidRoutePath(path: string): boolean {
  // Must start with /
  if (!path.startsWith('/')) {
    return false;
  }
  
  // Split into segments
  const segments = path.split('/').filter(segment => segment !== '');
  
  for (const segment of segments) {
    // Check for invalid characters
    if (!/^[a-zA-Z0-9_\-\[\]\.@()]+$/.test(segment)) {
      return false;
    }
    
    // Check dynamic segment format
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const inner = segment.slice(1, -1);
      if (!inner || inner.includes('[') || inner.includes(']')) {
        return false;
      }
    }
    
    // Check route group format
    if (segment.startsWith('(') && segment.endsWith(')')) {
      const inner = segment.slice(1, -1);
      if (!inner || inner.includes('(') || inner.includes(')')) {
        return false;
      }
    }
    
    // Check parallel route format
    if (segment.startsWith('@')) {
      const inner = segment.slice(1);
      if (!inner || !/^[a-zA-Z0-9_\-]+$/.test(inner)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Convert dynamic route to URL pattern
 */
export function routeToUrlPattern(routePath: string): string {
  return routePath
    .replace(/\[([^\]]+)\]/g, ':$1') // [id] -> :id
    .replace(/\[\.\.\.([^\]]+)\]/g, '*$1') // [...slug] -> *slug
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, '*$1?'); // [[...slug]] -> *slug?
}

/**
 * Convert URL pattern back to route path
 */
export function urlPatternToRoute(pattern: string): string {
  return pattern
    .replace(/:([^/]+)/g, '[$1]') // :id -> [id]
    .replace(/\*([^/?]+)\?/g, '[[...$1]]') // *slug? -> [[...slug]]
    .replace(/\*([^/?]+)/g, '[...$1]'); // *slug -> [...slug]
}

/**
 * Extract route parameters from URL
 */
export function extractRouteParams(routePath: string, actualUrl: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  
  const routeSegments = routePath.split('/').filter(s => s);
  const urlSegments = actualUrl.split('/').filter(s => s);
  
  let urlIndex = 0;
  
  for (const routeSegment of routeSegments) {
    if (routeSegment.startsWith('[') && routeSegment.endsWith(']')) {
      const paramName = routeSegment.slice(1, -1);
      
      if (paramName.startsWith('...')) {
        // Catch-all parameter
        const actualParamName = paramName.slice(3);
        params[actualParamName] = urlSegments.slice(urlIndex);
        break;
      } else {
        // Regular dynamic parameter
        if (urlIndex < urlSegments.length) {
          params[paramName] = urlSegments[urlIndex];
          urlIndex++;
        }
      }
    } else if (!routeSegment.startsWith('(') && !routeSegment.startsWith('@')) {
      // Static segment, move to next URL segment
      urlIndex++;
    }
    // Skip route groups and parallel routes
  }
  
  return params;
}