import * as vscode from 'vscode';

export interface PageContentSection {
  name: string;
  line: number;
  column: number;
  kind: vscode.SymbolKind;
}

export class PageContentItem extends vscode.TreeItem {
  public readonly name: string;
  public readonly line: number;
  public readonly column: number;
  public readonly kind: vscode.SymbolKind;
  public readonly filePath: string;

  constructor(
    section: PageContentSection,
    filePath: string
  ) {
    super(section.name, vscode.TreeItemCollapsibleState.None);

    this.name = section.name;
    this.line = section.line;
    this.column = section.column;
    this.kind = section.kind;
    this.filePath = filePath;

    // Set TreeItem properties
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.iconPath = this.getIcon();
    this.contextValue = 'page-content-item';
    this.resourceUri = vscode.Uri.file(filePath);

    // Set command to jump to location in file
    this.command = {
      command: 'vscode.open',
      title: 'Open',
      arguments: [
        vscode.Uri.file(filePath),
        {
          selection: new vscode.Range(
            new vscode.Position(this.line, this.column),
            new vscode.Position(this.line, this.column)
          )
        }
      ]
    };
  }

  /**
   * Get tooltip with location information
   */
  private getTooltip(): string {
    return `${this.name}\nLine: ${this.line + 1}, Column: ${this.column + 1}\nFile: ${this.filePath}`;
  }

  /**
   * Get description showing line number
   */
  private getDescription(): string {
    return `Line ${this.line + 1}`;
  }

  /**
   * Get icon based on symbol kind
   */
  private getIcon(): vscode.ThemeIcon {
    switch (this.kind) {
      case vscode.SymbolKind.Function:
        return new vscode.ThemeIcon('symbol-method');
      case vscode.SymbolKind.Variable:
        return new vscode.ThemeIcon('symbol-variable');
      case vscode.SymbolKind.Class:
        return new vscode.ThemeIcon('symbol-class');
      case vscode.SymbolKind.Interface:
        return new vscode.ThemeIcon('symbol-interface');
      case vscode.SymbolKind.Constant:
        return new vscode.ThemeIcon('symbol-constant');
      case vscode.SymbolKind.Property:
        return new vscode.ThemeIcon('symbol-property');
      case vscode.SymbolKind.Enum:
        return new vscode.ThemeIcon('symbol-enum');
      case vscode.SymbolKind.TypeParameter:
        return new vscode.ThemeIcon('symbol-type-parameter');
      default:
        return new vscode.ThemeIcon('symbol-misc');
    }
  }
}