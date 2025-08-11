export enum RouteFileType {
  Page = 'page',
  Layout = 'layout',
  Loading = 'loading',
  Error = 'error',
  NotFound = 'not-found',
  Route = 'route',
  Template = 'template',
  Default = 'default',
  GlobalError = 'global-error'
}

export enum RoutingPattern {
  Static = 'static',
  Dynamic = 'dynamic',
  CatchAll = 'catch-all',
  OptionalCatchAll = 'optional-catch-all',
  Parallel = 'parallel',
  Intercepting = 'intercepting',
  RouteGroup = 'route-group'
}

export interface NextJsRouteConfig {
  projectRoot: string;
  appDirectory: string;
  port: number;
  enablePageContentView: boolean;
  excludePatterns: string[];
}

export interface NextjsRouteItem {
  id: string;
  path: string;
  pattern: RoutingPattern;
  fileType: RouteFileType;
  filePath: string;
  isPage: boolean;
  isDynamic: boolean;
  segments: string[];
  parentId?: string;
  children?: NextjsRouteItem[];
}

export interface RouteInfo {
  path: string;
  pattern: RoutingPattern;
  fileType: RouteFileType;
  filePath: string;
  isPage: boolean;
  isDynamic: boolean;
  segments: string[];
}