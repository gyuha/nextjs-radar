import * as vscode from 'vscode';
import * as path from 'path';
import { PageContentItem, PageContentSection } from '../models';
import { RouteFileType } from '../constants';

export class PageContentProvider implements vscode.TreeDataProvider<PageContentItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PageContentItem | undefined | null | void> = new vscode.EventEmitter<PageContentItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<PageContentItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private currentFilePath: string | null = null;
  private contentItems: PageContentItem[] = [];

  constructor(private context: vscode.ExtensionContext) {
    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChanged, this, context.subscriptions);
    
    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this, context.subscriptions);

    // Initialize with current editor
    if (vscode.window.activeTextEditor) {
      this.onActiveEditorChanged(vscode.window.activeTextEditor);
    }
  }

  /**
   * TreeDataProvider implementation: getTreeItem
   */
  getTreeItem(element: PageContentItem): vscode.TreeItem {
    return element;
  }

  /**
   * TreeDataProvider implementation: getChildren
   */
  getChildren(element?: PageContentItem): Thenable<PageContentItem[]> {
    if (!element) {
      // Return root items (all content sections)
      return Promise.resolve(this.contentItems);
    }

    // Page content items don't have children
    return Promise.resolve([]);
  }

  /**
   * Handle active editor change
   */
  private async onActiveEditorChanged(editor?: vscode.TextEditor): Promise<void> {
    if (!editor || !this.isRelevantFile(editor.document.uri.fsPath)) {
      this.currentFilePath = null;
      this.contentItems = [];
      this._onDidChangeTreeData.fire();
      return;
    }

    this.currentFilePath = editor.document.uri.fsPath;
    await this.scanFileContent();
  }

  /**
   * Handle document change
   */
  private async onDocumentChanged(event: vscode.TextDocumentChangeEvent): Promise<void> {
    if (event.document.uri.fsPath === this.currentFilePath) {
      // Debounce to avoid excessive updates
      setTimeout(() => this.scanFileContent(), 500);
    }
  }

  /**
   * Check if file is relevant for content scanning
   */
  private isRelevantFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    
    // Check if it's a valid Next.js App Router file
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    if (!validExtensions.includes(ext)) {
      return false;
    }

    // Check if it's a Next.js App Router file
    const routeFiles = ['page', 'layout', 'loading', 'error', 'not-found', 'route', 'template', 'default', 'global-error'];
    const baseName = fileName.replace(/\.(tsx?|jsx?)$/, '');
    
    return routeFiles.includes(baseName);
  }

  /**
   * Scan current file for content sections
   */
  private async scanFileContent(): Promise<void> {
    if (!this.currentFilePath) {
      return;
    }

    try {
      // Get document symbols for the current file
      const uri = vscode.Uri.file(this.currentFilePath);
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        uri
      );

      if (symbols) {
        this.contentItems = this.extractContentItems(symbols);
      } else {
        this.contentItems = [];
      }

      this._onDidChangeTreeData.fire();
    } catch (error) {
      console.error('Failed to scan file content:', error);
      this.contentItems = [];
      this._onDidChangeTreeData.fire();
    }
  }

  /**
   * Extract content items from document symbols
   */
  private extractContentItems(symbols: vscode.DocumentSymbol[]): PageContentItem[] {
    const items: PageContentItem[] = [];

    const extractFromSymbol = (symbol: vscode.DocumentSymbol, parentName?: string) => {
      // Create section from symbol
      const section: PageContentSection = {
        name: parentName ? `${parentName}.${symbol.name}` : symbol.name,
        line: symbol.range.start.line,
        column: symbol.range.start.character,
        kind: symbol.kind
      };

      // Only include relevant symbols
      if (this.isRelevantSymbol(symbol)) {
        const item = new PageContentItem(section, this.currentFilePath!);
        items.push(item);
      }

      // Recursively process children
      if (symbol.children) {
        for (const child of symbol.children) {
          extractFromSymbol(child, symbol.name);
        }
      }
    };

    for (const symbol of symbols) {
      extractFromSymbol(symbol);
    }

    // Sort by line number
    items.sort((a, b) => a.line - b.line);

    return items;
  }

  /**
   * Check if symbol is relevant for display
   */
  private isRelevantSymbol(symbol: vscode.DocumentSymbol): boolean {
    // Include functions, classes, interfaces, constants, and variables
    const relevantKinds = [
      vscode.SymbolKind.Function,
      vscode.SymbolKind.Class,
      vscode.SymbolKind.Interface,
      vscode.SymbolKind.Constant,
      vscode.SymbolKind.Variable,
      vscode.SymbolKind.Property,
      vscode.SymbolKind.Enum,
      vscode.SymbolKind.TypeParameter
    ];

    if (!relevantKinds.includes(symbol.kind)) {
      return false;
    }

    // Exclude some common patterns
    const excludePatterns = [
      /^_/, // Private members starting with underscore
      /^use[A-Z]/, // React hooks (usually not navigation targets)
      /^handle[A-Z]/, // Event handlers (usually not primary navigation targets)
    ];

    return !excludePatterns.some(pattern => pattern.test(symbol.name));
  }

  /**
   * Refresh content for current file
   */
  public async refresh(): Promise<void> {
    if (this.currentFilePath) {
      await this.scanFileContent();
    }
  }

  /**
   * Set current file path manually
   */
  public async setCurrentFile(filePath: string): Promise<void> {
    if (this.isRelevantFile(filePath)) {
      this.currentFilePath = filePath;
      await this.scanFileContent();
    } else {
      this.currentFilePath = null;
      this.contentItems = [];
      this._onDidChangeTreeData.fire();
    }
  }

  /**
   * Get current file path
   */
  public getCurrentFile(): string | null {
    return this.currentFilePath;
  }

  /**
   * Get all content items
   */
  public getContentItems(): PageContentItem[] {
    return this.contentItems;
  }

  /**
   * Get content item by name
   */
  public getContentItemByName(name: string): PageContentItem | undefined {
    return this.contentItems.find(item => item.name === name);
  }

  /**
   * Navigate to content item
   */
  public async navigateToItem(item: PageContentItem): Promise<void> {
    if (!item.filePath) {
      return;
    }

    try {
      const uri = vscode.Uri.file(item.filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // Move cursor to the symbol location
      const position = new vscode.Position(item.line, item.column);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to navigate to ${item.name}: ${error}`);
    }
  }

  /**
   * Check if content view should be enabled for current file
   */
  public shouldShowContent(): boolean {
    return this.currentFilePath !== null && this.contentItems.length > 0;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    // Event listeners are already registered with context.subscriptions
    // They will be disposed automatically
  }
}