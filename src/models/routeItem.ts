import * as vscode from 'vscode';
import { RouteFileType, RoutingPattern, NextjsRouteItem } from '../constants';

export class RouteItem extends vscode.TreeItem implements NextjsRouteItem {
  public readonly id: string;
  public readonly path: string;
  public readonly pattern: RoutingPattern;
  public readonly fileType: RouteFileType;
  public readonly filePath: string;
  public readonly isPage: boolean;
  public readonly isDynamic: boolean;
  public readonly segments: string[];
  public readonly parentId?: string;
  public children?: RouteItem[];
  
  // VS Code TreeItem specific properties
  public readonly isCollapsible: boolean;

  constructor(
    id: string,
    label: string,
    path: string,
    filePath: string,
    fileType: RouteFileType,
    pattern: RoutingPattern,
    segments: string[],
    parentId?: string,
    children?: RouteItem[]
  ) {
    const collapsibleState = children && children.length > 0 
      ? vscode.TreeItemCollapsibleState.Collapsed 
      : vscode.TreeItemCollapsibleState.None;
    
    super(label, collapsibleState);

    this.id = id;
    this.path = path;
    this.pattern = pattern;
    this.fileType = fileType;
    this.filePath = filePath;
    this.segments = segments;
    this.parentId = parentId;
    this.children = children;
    
    // Route properties
    this.isPage = fileType === RouteFileType.Page;
    this.isDynamic = this.checkIfDynamic(pattern, segments);
    this.isCollapsible = collapsibleState !== vscode.TreeItemCollapsibleState.None;

    // Set VS Code TreeItem properties
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.iconPath = this.getIcon();
    this.contextValue = this.getContextValue();
    this.resourceUri = vscode.Uri.file(filePath);
  }

  /**
   * Get the display name for the route item
   */
  public getDisplayName(): string {
    const baseName = this.label as string;
    
    // For dynamic segments, show in a more readable format
    if (this.isDynamic) {
      return this.formatDynamicRoute(baseName);
    }
    
    return baseName;
  }

  /**
   * Get tooltip text with detailed information
   */
  public getTooltip(): string {
    const parts: string[] = [];
    
    parts.push(`Path: ${this.path}`);
    parts.push(`Type: ${this.fileType}`);
    parts.push(`Pattern: ${this.pattern}`);
    parts.push(`File: ${this.filePath}`);
    
    if (this.isDynamic) {
      parts.push('Dynamic: Yes');
    }
    
    if (this.children && this.children.length > 0) {
      parts.push(`Children: ${this.children.length}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Get description shown next to the label
   */
  private getDescription(): string {
    const parts: string[] = [];
    
    // Show file type if not a page
    if (this.fileType !== RouteFileType.Page) {
      parts.push(this.fileType);
    }
    
    // Show pattern indicators
    if (this.pattern === RoutingPattern.Dynamic) {
      parts.push('dynamic');
    } else if (this.pattern === RoutingPattern.CatchAll) {
      parts.push('catch-all');
    } else if (this.pattern === RoutingPattern.OptionalCatchAll) {
      parts.push('optional catch-all');
    } else if (this.pattern === RoutingPattern.Parallel) {
      parts.push('parallel');
    } else if (this.pattern === RoutingPattern.Intercepting) {
      parts.push('intercepting');
    } else if (this.pattern === RoutingPattern.RouteGroup) {
      parts.push('group');
    }
    
    return parts.join(' • ');
  }

  /**
   * Get icon for the route item based on type and pattern
   */
  public getIcon(): vscode.ThemeIcon {
    // Icon based on file type
    switch (this.fileType) {
      case RouteFileType.Page:
        return new vscode.ThemeIcon('file', new vscode.ThemeColor('charts.green'));
      case RouteFileType.Layout:
        return new vscode.ThemeIcon('layout', new vscode.ThemeColor('charts.purple'));
      case RouteFileType.Loading:
        return new vscode.ThemeIcon('loading', new vscode.ThemeColor('charts.yellow'));
      case RouteFileType.Error:
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
      case RouteFileType.NotFound:
        return new vscode.ThemeIcon('question', new vscode.ThemeColor('charts.red'));
      case RouteFileType.Route:
        return new vscode.ThemeIcon('globe', new vscode.ThemeColor('charts.orange'));
      case RouteFileType.Template:
        return new vscode.ThemeIcon('file-code', new vscode.ThemeColor('charts.blue'));
      case RouteFileType.Default:
        return new vscode.ThemeIcon('file-text', new vscode.ThemeColor('charts.gray'));
      case RouteFileType.GlobalError:
        return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red'));
      default:
        return new vscode.ThemeIcon('file');
    }
  }

  /**
   * Get context value for context menu actions
   */
  private getContextValue(): string {
    const values: string[] = ['nextjs-route'];
    
    values.push(this.fileType);
    values.push(this.pattern);
    
    if (this.isPage) {
      values.push('page');
    }
    
    if (this.isDynamic) {
      values.push('dynamic');
    }
    
    return values.join('-');
  }

  /**
   * Check if route is valid Next.js App Router route
   */
  public isValidNextjsRoute(): boolean {
    try {
      // Check if file type is valid
      if (!Object.values(RouteFileType).includes(this.fileType)) {
        return false;
      }
      
      // Check if pattern is valid
      if (!Object.values(RoutingPattern).includes(this.pattern)) {
        return false;
      }
      
      // Check if file path exists and has valid extension
      if (!this.filePath || !this.hasValidExtension()) {
        return false;
      }
      
      // Check segment validity
      if (!this.areSegmentsValid()) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if route has dynamic segments
   */
  private checkIfDynamic(pattern: RoutingPattern, segments: string[]): boolean {
    if ([
      RoutingPattern.Dynamic,
      RoutingPattern.CatchAll,
      RoutingPattern.OptionalCatchAll
    ].includes(pattern)) {
      return true;
    }
    
    // Check if any segment is dynamic
    return segments.some(segment => 
      segment.startsWith('[') && segment.endsWith(']')
    );
  }

  /**
   * Format dynamic route display name
   */
  private formatDynamicRoute(name: string): string {
    return name
      .replace(/\[([^\]]+)\]/g, ':$1')  // [id] -> :id
      .replace(/\[\.\.\.([^\]]+)\]/g, '...$1')  // [...slug] -> ...slug
      .replace(/\[\[\.\.\.([^\]]+)\]\]/g, '[...$1]');  // [[...slug]] -> [...slug]
  }

  /**
   * Check if file has valid extension
   */
  private hasValidExtension(): boolean {
    const validExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    return validExtensions.some(ext => this.filePath.endsWith(ext));
  }

  /**
   * Validate route segments
   */
  private areSegmentsValid(): boolean {
    return this.segments.every(segment => {
      // Empty segments are invalid
      if (!segment.trim()) {
        return false;
      }
      
      // Check for invalid characters
      const invalidChars = /[<>:"|?*]/;
      if (invalidChars.test(segment)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get normalized route path for URL generation
   */
  public getNormalizedPath(): string {
    return this.segments
      .filter(segment => !segment.startsWith('(') || !segment.endsWith(')')) // Remove route groups
      .map(segment => {
        // Convert dynamic segments
        if (segment.startsWith('[') && segment.endsWith(']')) {
          const inner = segment.slice(1, -1);
          if (inner.startsWith('...')) {
            return `*${inner.slice(3)}`; // [...slug] -> *slug
          }
          return `:${inner}`; // [id] -> :id
        }
        return segment;
      })
      .join('/');
  }

  /**
   * Check if this route can have children
   */
  public canHaveChildren(): boolean {
    return [
      RouteFileType.Layout,
      RouteFileType.Template
    ].includes(this.fileType) || this.pattern === RoutingPattern.RouteGroup;
  }

  /**
   * Add child route item
   */
  public addChild(child: RouteItem): void {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(child);
    
    // Update collapsible state
    if (this.collapsibleState === vscode.TreeItemCollapsibleState.None) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
  }

  /**
   * Remove child route item
   */
  public removeChild(childId: string): boolean {
    if (!this.children) {
      return false;
    }
    
    const index = this.children.findIndex(child => child.id === childId);
    if (index !== -1) {
      this.children.splice(index, 1);
      
      // Update collapsible state if no children left
      if (this.children.length === 0) {
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
      }
      
      return true;
    }
    
    return false;
  }
}