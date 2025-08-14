import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { 
  RouteFileType, 
  NextJsRouteConfig,
  DEFAULT_EXCLUDE_PATTERNS 
} from '../constants';
import { RouteItem } from '../models';
import { 
  findNextjsAppDir,
  scanAppRouterFiles,
  buildRouteHierarchy,
  sortRoutes,
  getWorkspaceRoot,
  isNextjsProject,
  AppRouterFile
} from '../utils';

export type ViewType = 'hierarchical' | 'flat';
export type SortingType = 'natural' | 'basic';

export interface NextjsRadarConfig extends NextJsRouteConfig {
  viewType?: ViewType;
  sortingType?: SortingType;
  showFileExtensions?: boolean;
  groupByType?: boolean;
  categorizeRoot?: boolean; // NEW: group routes into categories at root
  hostUrl?: string; // NEW: configurable host URL for opening in browser
}

export class NextjsRoutesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private routes: RouteItem[] = [];
  private allFiles: AppRouterFile[] = [];
  private workspaceRoot: string | null = null;
  private appDirectory: string | null = null;
  private config: NextjsRadarConfig = this.getDefaultConfig();
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private searchQuery: string = '';
  private filteredRoutes: RouteItem[] = [];
  private categoryContext = 'nextjs-radar-category';

  constructor(private context: vscode.ExtensionContext) {
    this.initialize();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): NextjsRadarConfig {
    return {
      projectRoot: './',
      appDirectory: 'src/app',
      port: 3000,
      enablePageContentView: true,
      excludePatterns: [...DEFAULT_EXCLUDE_PATTERNS],
      viewType: 'hierarchical',
      sortingType: 'natural',
      showFileExtensions: false,
      groupByType: true,
      categorizeRoot: true,
      hostUrl: 'http://localhost:3000'
    };
  }

  /**
   * Initialize the provider
   */
  private async initialize(): Promise<void> {
    this.workspaceRoot = getWorkspaceRoot();
    
    if (!this.workspaceRoot) {
      return;
    }

    // Check if this is a Next.js project
    if (!(await isNextjsProject(this.workspaceRoot))) {
      return;
    }

    // Load configuration
    await this.loadConfiguration();

    // Find app directory
    this.appDirectory = await findNextjsAppDir(this.workspaceRoot);
    
    if (!this.appDirectory) {
      return;
    }

    // Initial scan
    await this.refresh();

    // Set up file watcher
    this.setupFileWatcher();

    // Set up configuration change listener
    this.setupConfigurationChangeListener();
  }

  /**
   * Load configuration from workspace
   */
  private async loadConfiguration(): Promise<void> {
    if (!this.workspaceRoot) {
      return;
    }

    try {
      // Try to load from .vscode/nextjs-radar.json
      const configPath = path.join(this.workspaceRoot, '.vscode', 'nextjs-radar.json');
      
      if (await this.fileExists(configPath)) {
        const configContent = await fs.promises.readFile(configPath, 'utf8');
        const loadedConfig = JSON.parse(configContent) as Partial<NextjsRadarConfig>;
        this.config = { ...this.config, ...loadedConfig };
      }

      // Also check VS Code settings
      const workspaceConfig = vscode.workspace.getConfiguration('nextjsRadar');
      
      if (workspaceConfig) {
        this.config.viewType = workspaceConfig.get('viewType', this.config.viewType);
        this.config.sortingType = workspaceConfig.get('sortingType', this.config.sortingType);
        this.config.showFileExtensions = workspaceConfig.get('showFileExtensions', this.config.showFileExtensions);
        this.config.groupByType = workspaceConfig.get('groupByType', this.config.groupByType);
        this.config.categorizeRoot = workspaceConfig.get('categorizeRoot', this.config.categorizeRoot);
        this.config.hostUrl = workspaceConfig.get('hostUrl', this.config.hostUrl);
        
        // Debug: Log loaded configuration
        console.log('Next.js Radar: Configuration loaded:', {
          hostUrl: this.config.hostUrl,
          viewType: this.config.viewType,
          port: this.config.port
        });
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  /**
   * Set up file system watcher
   */
  private setupFileWatcher(): void {
    if (!this.appDirectory) {
      return;
    }

    // Watch for changes in the app directory
    const pattern = new vscode.RelativePattern(this.appDirectory, '**/*.{ts,tsx,js,jsx}');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.fileWatcher.onDidCreate(() => this.refresh());
    this.fileWatcher.onDidDelete(() => this.refresh());
    this.fileWatcher.onDidChange(() => this.refresh());

    // Register for cleanup
    this.context.subscriptions.push(this.fileWatcher);
  }

  /**
   * Set up configuration change listener
   */
  private setupConfigurationChangeListener(): void {
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('nextjsRadar')) {
        // Reload configuration when Next.js Radar settings change
        this.loadConfiguration().then(() => {
          console.log('Next.js Radar: Configuration reloaded due to settings change');
        });
      }
    });

    // Register for cleanup
    this.context.subscriptions.push(configChangeListener);
  }

  /**
   * Refresh the tree data
   */
  public async refresh(): Promise<void> {
    if (!this.appDirectory) {
      return;
    }

    try {
      // Scan for route files
      this.allFiles = await scanAppRouterFiles(this.appDirectory);
      // Build hierarchy
      const allRoutes = buildRouteHierarchy(this.allFiles);
      // Apply view type
      this.routes = this.config.viewType === 'flat' ? this.flattenRoutes(allRoutes) : allRoutes;
      // Apply sorting
      this.routes = this.applySorting(this.routes);
      // Apply search filter if active
      this.filteredRoutes = this.searchQuery ? this.filterRoutes(this.routes, this.searchQuery.toLowerCase()) : this.routes;
      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('Failed to refresh routes:', error);
      vscode.window.showErrorMessage(`Failed to refresh Next.js routes: ${error}`);
    }
  }

  /**
   * TreeDataProvider implementation: getTreeItem
   */
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem { return element; }

  /**
   * TreeDataProvider implementation: getChildren
   */
  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }
    if ((element as any).categoryChildren) {
      return Promise.resolve((element as any).categoryChildren);
    }
    const route = element as RouteItem;
    return Promise.resolve(route.children || []);
  }

  /** Build root items with optional categories */
  private getRootItems(): vscode.TreeItem[] {
    if (!this.config.categorizeRoot) {
      return this.filteredRoutes;
    }
    
    const categories: Record<string, RouteItem[]> = {};
    const add = (group: string, item: RouteItem) => { (categories[group] ||= []).push(item); };
    for (const r of this.filteredRoutes) {
      switch (r.fileType) {
        case RouteFileType.Page: add('PAGES', r); break;
        case RouteFileType.Layout: add('LAYOUTS', r); break;
        case RouteFileType.Route: add('API ROUTES', r); break;
        case RouteFileType.Error:
        case RouteFileType.GlobalError:
        case RouteFileType.NotFound: add('ERRORS', r); break;
        case RouteFileType.Loading: add('LOADING', r); break;
        case RouteFileType.Template: add('TEMPLATES', r); break;
        default: add('OTHERS', r); break;
      }
    }
    const categoryItems = Object.keys(categories).sort().map(name => {
      const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.Collapsed);
      (item as any).categoryChildren = categories[name];
      item.iconPath = new vscode.ThemeIcon('symbol-folder');
      item.contextValue = this.categoryContext;
      item.tooltip = `${name} • ${categories[name].length}`;
      return item;
    });
    return categoryItems;
  }


  /**
   * Get parent of an element (for reveal functionality)
   */
  getParent(element: RouteItem): RouteItem | undefined {
    if (!element.parentId) {
      return undefined;
    }

    // Find parent in the tree
    return this.findRouteById(element.parentId, this.routes);
  }

  /**
   * Find route by ID recursively
   */
  private findRouteById(id: string, routes: RouteItem[]): RouteItem | undefined {
    for (const route of routes) {
      if (route.id === id) {
        return route;
      }
      
      if (route.children) {
        const found = this.findRouteById(id, route.children);
        if (found) {
          return found;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Flatten hierarchical routes for flat view
   */
  private flattenRoutes(routes: RouteItem[]): RouteItem[] {
    const flattened: RouteItem[] = [];
    
    const flatten = (items: RouteItem[], depth: number = 0) => {
      for (const item of items) {
        // Create a copy with modified label to show depth
        const flatItem = new RouteItem(
          item.id,
          this.config.viewType === 'flat' ? '  '.repeat(depth) + item.label : item.label as string,
          item.path,
          item.filePath,
          item.fileType,
          item.pattern,
          item.segments,
          item.parentId
        );
        
        flattened.push(flatItem);
        
        if (item.children) {
          flatten(item.children, depth + 1);
        }
      }
    };
    
    flatten(routes);
    return flattened;
  }

  /**
   * Apply sorting to routes
   */
  private applySorting(routes: RouteItem[]): RouteItem[] {
    if (this.config.sortingType === 'natural') {
      return sortRoutes([...routes]);
    }
    
    // Basic alphabetical sorting
    return [...routes].sort((a, b) => {
      return (a.label as string).localeCompare(b.label as string);
    });
  }

  /**
   * Apply search filter
   */
  public applySearch(query: string): void {
    this.searchQuery = query.toLowerCase().trim();
    
    if (!this.searchQuery) {
      this.filteredRoutes = this.routes;
    } else {
      this.filteredRoutes = this.filterRoutes(this.routes, this.searchQuery);
    }
    
    this._onDidChangeTreeData.fire();
  }


  /**
   * Filter routes based on search query
   */
  private filterRoutes(routes: RouteItem[], query: string): RouteItem[] {
    if (!query.trim()) {
      return routes;
    }

    const filtered: RouteItem[] = [];
    
    for (const route of routes) {
      let includeRoute = false;
      let filteredChildren: RouteItem[] = [];
      
      // Check if route matches search
      const matchesSearch = 
        (route.label as string).toLowerCase().includes(query) ||
        route.path.toLowerCase().includes(query) ||
        route.filePath.toLowerCase().includes(query) ||
        route.fileType.toLowerCase().includes(query);
      
      if (matchesSearch) {
        includeRoute = true;
      }
      
      // Recursively filter children
      if (route.children) {
        filteredChildren = this.filterRoutes(route.children, query);
        if (filteredChildren.length > 0) {
          includeRoute = true;
        }
      }
      
      if (includeRoute) {
        const filteredRoute = new RouteItem(
          route.id,
          route.label as string,
          route.path,
          route.filePath,
          route.fileType,
          route.pattern,
          route.segments,
          route.parentId,
          filteredChildren.length > 0 ? filteredChildren : undefined
        );
        
        filtered.push(filteredRoute);
      }
    }
    
    return filtered;
  }


  /**
   * Change view type
   */
  public setViewType(viewType: ViewType): void {
    this.config.viewType = viewType;
    this.refresh();
  }

  /**
   * Change sorting type
   */
  public setSortingType(sortingType: SortingType): void {
    this.config.sortingType = sortingType;
    this.refresh();
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): NextjsRadarConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public async updateConfiguration(updates: Partial<NextjsRadarConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Save to workspace configuration file
    if (this.workspaceRoot) {
      try {
        const configDir = path.join(this.workspaceRoot, '.vscode');
        const configPath = path.join(configDir, 'nextjs-radar.json');
        
        // Ensure .vscode directory exists
        await fs.promises.mkdir(configDir, { recursive: true });
        
        // Write configuration
        await fs.promises.writeFile(
          configPath, 
          JSON.stringify(this.config, null, 2), 
          'utf8'
        );
      } catch (error) {
        console.error('Failed to save configuration:', error);
      }
    }
    
    await this.refresh();
  }

  /**
   * Get route by file path
   */
  public getRouteByFilePath(filePath: string): RouteItem | undefined {
    const findInRoutes = (routes: RouteItem[]): RouteItem | undefined => {
      for (const route of routes) {
        if (route.filePath === filePath) {
          return route;
        }
        
        if (route.children) {
          const found = findInRoutes(route.children);
          if (found) {
            return found;
          }
        }
      }
      return undefined;
    };
    
    return findInRoutes(this.routes);
  }

  /**
   * Get all routes (for external access)
   */
  public getAllRoutes(): RouteItem[] {
    return this.routes;
  }

  /**
   * Get app directory path
   */
  public getAppDirectory(): string | null {
    return this.appDirectory;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
  }
}
