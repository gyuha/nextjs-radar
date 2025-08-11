export type RouteType = 
  | 'static'
  | 'dynamic'
  | 'catch-all'
  | 'optional-catch-all'
  | 'group'
  | 'parallel'
  | 'intercept'
  | 'api'
  | 'layout'
  | 'loading'
  | 'error'
  | 'not-found'
  | 'template'
  | 'default'
  | 'global-error';

export type FileType = 
  | 'page'
  | 'layout'
  | 'loading'
  | 'error'
  | 'not-found'
  | 'route'
  | 'template'
  | 'default'
  | 'global-error';

export interface NextJsRouteConfig {
  projectRoot: string;
  appDirectory: string;
  port: number;
  enablePageContentView: boolean;
  excludePatterns: string[];
}

export interface RouteInfo {
  path: string;
  type: RouteType;
  fileType: FileType;
  filePath: string;
  isPage: boolean;
  isDynamic: boolean;
  segments: string[];
}