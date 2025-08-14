interface RouteParameter {
  id: string;
  key: string;
  value: string;
}

/**
 * Replace dynamic segments in a Next.js route path with parameter values
 * @param routePath - The route path (e.g., "/blog/[slug]/[id]")
 * @param parameters - Array of parameter key-value pairs
 * @returns The path with replaced parameters (e.g., "/blog/my-post/123")
 */
export function replaceRouteParameters(routePath: string, parameters: RouteParameter[]): string {
  if (!routePath || parameters.length === 0) {
    return routePath;
  }

  let replacedPath = routePath;

  // Create a map of parameter keys to values for quick lookup
  const paramMap = new Map<string, string>();
  parameters.forEach(param => {
    if (param.key && param.value) {
      paramMap.set(param.key, param.value);
    }
  });

  // Replace dynamic segments with parameter values
  // Handle different Next.js dynamic segment patterns:
  // [param] - Dynamic segments
  // [...param] - Catch-all segments
  // [[...param]] - Optional catch-all segments
  // Use [a-zA-Z0-9_-]+ to support letters, numbers, underscores, and hyphens
  replacedPath = replacedPath.replace(/\[\.\.\.([a-zA-Z0-9_-]+)\]/g, (match, paramName) => {
    // Catch-all segments [...param]
    const value = paramMap.get(paramName);
    if (value) {
      // If it's a catch-all, the value might contain multiple segments separated by /
      return value.startsWith('/') ? value.slice(1) : value;
    }
    return match; // Keep original if no replacement found
  });

  replacedPath = replacedPath.replace(/\[\[\.\.\.([a-zA-Z0-9_-]+)\]\]/g, (match, paramName) => {
    // Optional catch-all segments [[...param]]
    const value = paramMap.get(paramName);
    if (value) {
      return value.startsWith('/') ? value.slice(1) : value;
    }
    return ''; // Optional catch-all can be empty
  });

  replacedPath = replacedPath.replace(/\[([a-zA-Z0-9_-]+)\]/g, (match, paramName) => {
    // Regular dynamic segments [param]
    const value = paramMap.get(paramName);
    return value || match; // Keep original if no replacement found
  });

  // Handle *param pattern (used by some route visualizers)
  replacedPath = replacedPath.replace(/\*([a-zA-Z0-9_-]+)/g, (match, paramName) => {
    // Dynamic segments *param
    const value = paramMap.get(paramName);
    return value || match; // Keep original if no replacement found
  });

  // Handle :param pattern (used by some route visualizers like Express-style)
  replacedPath = replacedPath.replace(/:([a-zA-Z0-9_-]+)/g, (match, paramName) => {
    // Dynamic segments :param
    const value = paramMap.get(paramName);
    return value || match; // Keep original if no replacement found
  });

  return replacedPath;
}

/**
 * Extract dynamic parameter names from a Next.js route path
 * @param routePath - The route path (e.g., "/blog/[slug]/[id]")
 * @returns Array of parameter names found in the path
 */
export function extractRouteParameters(routePath: string): string[] {
  if (!routePath) {
    return [];
  }

  const parameters: string[] = [];
  
  // Match different dynamic segment patterns
  // Use [a-zA-Z0-9_-]+ to support letters, numbers, underscores, and hyphens
  const patterns = [
    /\[\.\.\.([a-zA-Z0-9_-]+)\]/g,      // [...param]
    /\[\[\.\.\.([a-zA-Z0-9_-]+)\]\]/g,  // [[...param]]
    /\[([a-zA-Z0-9_-]+)\]/g,           // [param]
    /\*([a-zA-Z0-9_-]+)/g,             // *param
    /:([a-zA-Z0-9_-]+)/g               // :param
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(routePath)) !== null) {
      parameters.push(match[1]);
    }
  });

  return [...new Set(parameters)]; // Remove duplicates
}

/**
 * Check if a route path has dynamic segments that need parameter replacement
 * @param routePath - The route path to check
 * @returns True if the path contains dynamic segments
 */
export function hasDynamicSegments(routePath: string): boolean {
  if (!routePath) {
    return false;
  }

  return /\[[a-zA-Z0-9_.\[\]-]*\]|\*[a-zA-Z0-9_-]+|:[a-zA-Z0-9_-]+/.test(routePath);
}

/**
 * Get missing parameters for a route path
 * @param routePath - The route path
 * @param parameters - Current parameter settings
 * @returns Array of parameter names that are missing values
 */
export function getMissingParameters(routePath: string, parameters: RouteParameter[]): string[] {
  const requiredParams = extractRouteParameters(routePath);
  const paramMap = new Map(parameters.map(p => [p.key, p.value]));
  
  return requiredParams.filter(paramName => {
    const value = paramMap.get(paramName);
    return !value || value.trim() === '';
  });
}