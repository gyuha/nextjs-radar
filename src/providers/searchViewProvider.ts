import * as vscode from 'vscode';
import { NextjsRoutesProvider } from './routesProvider';
import { RouteItem } from '../models';
import { RouteFileType } from '../constants';

interface SearchResult {
  query: string;
  totalResults: number;
  categories: {
    [key: string]: {
      name: string;
      count: number;
      routes: RouteItem[];
      expanded: boolean;
    };
  };
}

interface RouteParameter {
  id: string;
  key: string;
  value: string;
}

export class NextjsSearchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'nextjsRadar.search';
  private _view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private currentResults: SearchResult | null = null;
  private initialScanCompleted = false; // 스캔 완료 여부 플래그
  private parameters: RouteParameter[] = [];

  constructor(private routesProvider: NextjsRoutesProvider, private context: vscode.ExtensionContext) {
    // 라우트 변경(초기 스캔 포함) 시 검색 갱신
    this.routesProvider.onDidChangeTreeData(() => {
      this.initialScanCompleted = true;
      // 기존 쿼리를 유지하여 재검색 (없으면 전체 목록)
      this.performSearch(this.currentResults?.query || '');
    });
    
    // 저장된 파라미터 로드
    this.loadParameters();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true
    };

    // 초기 HTML 설정
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(msg => {
      switch (msg.type) {
        case 'search':
          this.performSearch(msg.value || '');
          break;
        case 'clear':
          this.clearSearch();
          break;
        case 'toggle-category':
          this.toggleCategory(msg.category);
          break;
        case 'open-route':
          this.openRoute(msg.filePath);
          break;
        case 'open-file':
          this.openRoute(msg.filePath);
          break;
        case 'open-browser':
          this.openInBrowser(msg.path);
          break;
        case 'add-parameter':
          this.addParameter();
          break;
        case 'delete-parameter':
          this.deleteParameter(msg.id);
          break;
        case 'update-parameter':
          this.updateParameter(msg.id, msg.key, msg.value);
          break;
      }
    }, undefined, this.disposables);
  }

  private performSearch(query: string): void {
    const allRoutes = this.routesProvider.getAllRoutes();
    const flatRoutes = this.flattenRoutes(allRoutes);
    
    let matchedRoutes: RouteItem[];
    
      if (!query || query.trim() === "") {
        matchedRoutes = flatRoutes;
      } else {
        // Filter routes based on query
        matchedRoutes = flatRoutes.filter(route => 
          (route.label as string).toLowerCase().includes(query.toLowerCase()) ||
          route.path.toLowerCase().includes(query.toLowerCase()) ||
          route.filePath.toLowerCase().includes(query.toLowerCase()) ||
          route.fileType.toLowerCase().includes(query.toLowerCase())
        );
      }

    // Group by file type
    const categories: SearchResult['categories'] = {};
    
    for (const route of matchedRoutes) {
      const categoryName = this.getCategoryName(route.fileType);
      if (!categories[categoryName]) {
        categories[categoryName] = {
          name: categoryName,
          count: 0,
          routes: [],
          expanded: true
        };
      }
      categories[categoryName].routes.push(route);
      categories[categoryName].count++;
    }

    this.currentResults = {
      query: query || '',
      totalResults: matchedRoutes.length,
      categories
    };

    this.updateView();
  }

  private clearSearch(): void {
    this.performSearch(''); // Show all routes when clearing search
  }

  private toggleCategory(category: string): void {
    if (this.currentResults && this.currentResults.categories[category]) {
      this.currentResults.categories[category].expanded = !this.currentResults.categories[category].expanded;
      this.updateView();
    }
  }

  private async openRoute(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  private async openInBrowser(routePath: string): Promise<void> {
    try {
      const config = this.routesProvider.getConfiguration();
      const url = `http://localhost:${config.port}${routePath}`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open in browser: ${error}`);
    }
  }

  private getCategoryName(fileType: RouteFileType): string {
    switch (fileType) {
      case RouteFileType.Page: return 'PAGES';
      case RouteFileType.Layout: return 'LAYOUTS';
      case RouteFileType.Route: return 'API ROUTES';
      case RouteFileType.Loading: return 'LOADING';
      case RouteFileType.Error:
      case RouteFileType.GlobalError:
      case RouteFileType.NotFound: return 'ERRORS';
      case RouteFileType.Template: return 'TEMPLATES';
      default: return 'OTHERS';
    }
  }

  private flattenRoutes(routes: RouteItem[]): RouteItem[] {
    const flattened: RouteItem[] = [];
    const flatten = (items: RouteItem[]) => {
      for (const item of items) {
        flattened.push(item);
        if (item.children) {
          flatten(item.children);
        }
      }
    };
    flatten(routes);
    return flattened;
  }

  private updateView(): void {
    if (this._view) {
      // 검색 결과와 파라미터 정보 업데이트
      this._view.webview.postMessage({
        type: 'updateResults',
        results: this.currentResults,
        parameters: this.parameters
      });
    }
  }

  private getHtml(): string {
    const nonce = Date.now().toString();
    
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
body { 
  padding: 4px; 
  margin: 0; 
  font-family: var(--vscode-font-family); 
  color: var(--vscode-foreground); 
  font-size: 13px;
}

.search-container {
  margin-bottom: 8px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 4px 24px 4px 8px;
  box-sizing: border-box;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, var(--vscode-editorWidget-border));
  border-radius: 2px;
  font-size: 13px;
  height: 26px;
}

.search-input:focus {
  outline: 1px solid var(--vscode-focusBorder);
}

.clear-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--vscode-icon-foreground);
  font-size: 16px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
  border-radius: 3px;
}

.results-summary {
  padding: 4px 8px;
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 3px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}

.category {
  margin-bottom: 2px;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 4px;
  cursor: pointer;
  border-radius: 3px;
}

.category-header:hover {
  background: var(--vscode-list-hoverBackground);
}

.category-icon {
  margin-right: 4px;
  font-size: 12px;
  width: 16px;
}

.category-name {
  font-weight: 500;
  margin-right: 8px;
}

.category-count {
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
}

.route-list {
  margin-left: 20px;
}

.route-item {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  position: relative;
}

.route-item:hover {
  background: var(--vscode-list-hoverBackground);
}

.route-item:hover .route-actions {
  opacity: 1;
}

.route-content {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.route-icon {
  margin-right: 6px;
  font-size: 12px;
  width: 16px;
}

.route-path {
  color: var(--vscode-foreground);
  margin-right: 8px;
  flex: 1;
}

.route-file {
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
}

.route-actions {
  opacity: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  transition: opacity 0.15s ease;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  color: var(--vscode-icon-foreground);
  font-size: 11px;
  background: transparent;
  border: none;
  padding: 0;
}

.action-btn:hover {
  background: var(--vscode-toolbar-hoverBackground);
  color: var(--vscode-foreground);
}

.action-btn.file-btn:hover {
  background: var(--vscode-button-hoverBackground);
}

.action-btn.browser-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground);
}

.no-results {
  padding: 20px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-style: italic;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
}

.parameters-section {
  margin-top: 16px;
  border-top: 1px solid var(--vscode-panel-border);
  padding-top: 12px;
}

.parameters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.parameters-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.add-parameter-btn {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 1px solid var(--vscode-button-border);
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.add-parameter-btn:hover {
  background: var(--vscode-button-hoverBackground);
}

.parameters-table {
  width: 100%;
  border-collapse: collapse;
}

.parameters-table th,
.parameters-table td {
  padding: 6px 8px;
  text-align: left;
  font-size: 12px;
  border-bottom: 1px solid var(--vscode-widget-border);
}

.parameters-table th {
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-weight: 600;
}

.parameter-input {
  width: 100%;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 2px;
  padding: 2px 4px;
  font-size: 12px;
}

.parameter-input:focus {
  outline: 1px solid var(--vscode-focusBorder);
}

.delete-parameter-btn {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid var(--vscode-errorForeground);
  background: transparent;
  color: var(--vscode-errorForeground);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-parameter-btn:hover {
  background: var(--vscode-errorForeground);
  color: var(--vscode-errorBackground);
}

.parameters-empty {
  padding: 16px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  font-style: italic;
}
</style>
</head>
<body>
  <div class="search-container">
    <div class="search-wrapper">
      <input 
        id="search" 
        class="search-input" 
        type="text" 
        placeholder="Search routes, paths, files..." 
        value="${this.currentResults?.query || ''}"
      />
      <div class="clear-btn" id="clear" title="Clear Search">×</div>
    </div>
  </div>

  <div id="results-container">${this.getResultsHtml()}</div>

  <div class="parameters-section">
    <div class="parameters-header">
      <h3>Route Parameters</h3>
      <button id="add-parameter" class="add-parameter-btn" title="Add Parameter">+</button>
    </div>
    <div id="parameters-container">${this.getParametersHtml()}</div>
  </div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const searchInput = document.getElementById('search');
const clearBtn = document.getElementById('clear');

let searchTimeout;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    vscode.postMessage({ type: 'search', value: searchInput.value });
  }, 300);
});

// 결과 업데이트 메시지 처리
window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'updateResults') {
    updateResultsDisplay(message.results);
    updateParametersDisplay(message.parameters || []);
  }
});

function updateResultsDisplay(results) {
  const resultsContainer = document.getElementById('results-container');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = getResultsHtml(results);
}

function updateParametersDisplay(parameters) {
  const parametersContainer = document.getElementById('parameters-container');
  if (!parametersContainer) return;
  
  parametersContainer.innerHTML = getParametersHtml(parameters);
}

function getResultsHtml(currentResults) {
  if (!currentResults) {
    return \`
      <div class="empty-state">
        Loading routes...<br>
        <small>Please wait while routes are being loaded</small>
      </div>
    \`;
  }

  if (currentResults.totalResults === 0) {
    if (currentResults.query) {
      return \`
        <div class="no-results">
          No routes found for "\${currentResults.query}"
        </div>
      \`;
    } else {
      return \`
        <div class="no-results">
          No routes found in this project<br>
          <small>Make sure this is a Next.js App Router project</small>
        </div>
      \`;
    }
  }

  const categoriesHtml = Object.entries(currentResults.categories)
    .map(([key, category]) => {
      const expandIcon = category.expanded ? '▼' : '▶';
      const routesHtml = category.expanded ? 
        category.routes.map(route => \`
          <div class="route-item">
            <div class="route-content" data-filepath="\${route.filePath}">
              <span class="route-icon">\${getFileIcon(route.fileType)}</span>
              <span class="route-path">\${route.path}</span>
              <span class="route-file">\${getFileName(route.filePath)}</span>
            </div>
            <div class="route-actions">
              <button class="action-btn file-btn" data-action="open-file" data-filepath="\${route.filePath}" title="Open File">
                📄
              </button>
              \${canOpenInBrowser(route.fileType) ? \`
                <button class="action-btn browser-btn" data-action="open-browser" data-path="\${route.path}" title="Open in Browser">
                  🌐
                </button>
              \` : ''}
            </div>
          </div>
        \`).join('') : '';

      return \`
        <div class="category">
          <div class="category-header" data-category="\${key}">
            <span class="category-icon">\${expandIcon}</span>
            <span class="category-name">\${category.name}</span>
            <span class="category-count">\${category.count}</span>
          </div>
          \${category.expanded ? \`<div class="route-list">\${routesHtml}</div>\` : ''}
        </div>
      \`;
    }).join('');

  const summaryText = currentResults.query 
    ? \`\${currentResults.totalResults} routes found\` 
    : \`\${currentResults.totalResults} total routes\`;

  return \`
    <div class="results-summary">
      \${summaryText}
    </div>
    <div class="results-list">
      \${categoriesHtml}
    </div>
  \`;
}

function getFileIcon(fileType) {
  switch (fileType) {
    case 'page': return '📄';
    case 'layout': return '🔧';
    case 'route': return '🌐';
    case 'loading': return '⏳';
    case 'error':
    case 'global-error':
    case 'not-found': return '❌';
    case 'template': return '📝';
    default: return '📁';
  }
}

function getFileName(filePath) {
  return filePath.split('/').pop() || filePath;
}

function canOpenInBrowser(fileType) {
  return fileType === 'page' || fileType === 'route';
}

function getParametersHtml(parameters) {
  if (!parameters || parameters.length === 0) {
    return \`
      <div class="parameters-empty">
        No route parameters defined.<br>
        Click + to add your first parameter.
      </div>
    \`;
  }

  const parametersRows = parameters.map(param => \`
    <tr>
      <td>
        <input 
          type="text" 
          class="parameter-input" 
          value="\${param.key}" 
          data-param-id="\${param.id}" 
          data-field="key"
          placeholder="Parameter key"
        />
      </td>
      <td>
        <input 
          type="text" 
          class="parameter-input" 
          value="\${param.value}" 
          data-param-id="\${param.id}" 
          data-field="value"
          placeholder="Parameter value"
        />
      </td>
      <td>
        <button 
          class="delete-parameter-btn" 
          data-param-id="\${param.id}" 
          title="Delete Parameter"
        >×</button>
      </td>
    </tr>
  \`).join('');

  return \`
    <table class="parameters-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        \${parametersRows}
      </tbody>
    </table>
  \`;
}

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  vscode.postMessage({ type: 'clear' });
});

// Add parameter button event listener
document.getElementById('add-parameter').addEventListener('click', () => {
  vscode.postMessage({ type: 'add-parameter' });
});

// Parameter input event listeners
document.addEventListener('input', (e) => {
  if (e.target.classList.contains('parameter-input')) {
    const paramId = e.target.dataset.paramId;
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    // Get the current parameters from the DOM
    const keyInput = document.querySelector(\`input[data-param-id="\${paramId}"][data-field="key"]\`);
    const valueInput = document.querySelector(\`input[data-param-id="\${paramId}"][data-field="value"]\`);
    
    vscode.postMessage({ 
      type: 'update-parameter', 
      id: paramId, 
      key: keyInput.value, 
      value: valueInput.value 
    });
  }
});

document.addEventListener('click', (e) => {
  // Handle parameter deletion
  if (e.target.classList.contains('delete-parameter-btn')) {
    const paramId = e.target.dataset.paramId;
    vscode.postMessage({ type: 'delete-parameter', id: paramId });
    return;
  }
  
  // Handle category toggle
  if (e.target.classList.contains('category-header') || e.target.closest('.category-header')) {
    const header = e.target.classList.contains('category-header') ? e.target : e.target.closest('.category-header');
    const category = header.dataset.category;
    vscode.postMessage({ type: 'toggle-category', category });
    return;
  }
  
  // Handle action buttons
  if (e.target.classList.contains('action-btn') || e.target.closest('.action-btn')) {
    e.stopPropagation(); // Prevent route-content click
    const btn = e.target.classList.contains('action-btn') ? e.target : e.target.closest('.action-btn');
    const action = btn.dataset.action;
    
    if (action === 'open-file') {
      const filePath = btn.dataset.filepath;
      vscode.postMessage({ type: 'open-file', filePath });
    } else if (action === 'open-browser') {
      const path = btn.dataset.path;
      vscode.postMessage({ type: 'open-browser', path });
    }
    return;
  }
  
  // Handle route content click (open file)
  if (e.target.classList.contains('route-content') || e.target.closest('.route-content')) {
    const content = e.target.classList.contains('route-content') ? e.target : e.target.closest('.route-content');
    const filePath = content.dataset.filepath;
    vscode.postMessage({ type: 'open-route', filePath });
  }
});
</script>
</body>
</html>`;
  }

  private getResultsHtml(): string {
    if (!this.currentResults) {
      return `
        <div class="empty-state">
          Loading routes...<br>
          <small>Please wait while routes are being loaded</small>
        </div>
      `;
    }

  if (this.currentResults.totalResults === 0 && this.initialScanCompleted) {
      if (this.currentResults.query) {
        return `
          <div class="no-results">
            No routes found for "${this.currentResults.query}"
          </div>
        `;
      } else {
        return `
          <div class="no-results">
            No routes found in this project<br>
            <small>Make sure this is a Next.js App Router project</small>
          </div>
        `;
      }
    }

    const categoriesHtml = Object.entries(this.currentResults.categories)
      .map(([key, category]) => {
        const expandIcon = category.expanded ? '▼' : '▶';
        const routesHtml = category.expanded ? 
          category.routes.map(route => `
            <div class="route-item">
              <div class="route-content" data-filepath="${route.filePath}">
                <span class="route-icon">${this.getFileIcon(route.fileType)}</span>
                <span class="route-path">${route.path}</span>
                <span class="route-file">${this.getFileName(route.filePath)}</span>
              </div>
              <div class="route-actions">
                <button class="action-btn file-btn" data-action="open-file" data-filepath="${route.filePath}" title="Open File">
                  📄
                </button>
                ${this.canOpenInBrowser(route.fileType) ? `
                  <button class="action-btn browser-btn" data-action="open-browser" data-path="${route.path}" title="Open in Browser">
                    🌐
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('') : '';

        return `
          <div class="category">
            <div class="category-header" data-category="${key}">
              <span class="category-icon">${expandIcon}</span>
              <span class="category-name">${category.name}</span>
              <span class="category-count">${category.count}</span>
            </div>
            ${category.expanded ? `<div class="route-list">${routesHtml}</div>` : ''}
          </div>
        `;
      }).join('');

    const summaryText = this.currentResults.query 
      ? `${this.currentResults.totalResults} routes found` 
      : `${this.currentResults.totalResults} total routes`;

    return `
      <div class="results-summary">
        ${summaryText}
      </div>
      <div class="results-list">
        ${categoriesHtml}
      </div>
    `;
  }

  private getFileIcon(fileType: RouteFileType): string {
    switch (fileType) {
      case RouteFileType.Page: return '📄';
      case RouteFileType.Layout: return '🔧';
      case RouteFileType.Route: return '🌐';
      case RouteFileType.Loading: return '⏳';
      case RouteFileType.Error:
      case RouteFileType.GlobalError:
      case RouteFileType.NotFound: return '❌';
      case RouteFileType.Template: return '📝';
      default: return '📁';
    }
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  private canOpenInBrowser(fileType: RouteFileType): boolean {
    // Only pages and API routes can be opened in browser
    return fileType === RouteFileType.Page || fileType === RouteFileType.Route;
  }

  private getParametersHtml(): string {
    if (this.parameters.length === 0) {
      return `
        <div class="parameters-empty">
          No route parameters defined.<br>
          Click + to add your first parameter.
        </div>
      `;
    }

    const parametersRows = this.parameters.map(param => `
      <tr>
        <td>
          <input 
            type="text" 
            class="parameter-input" 
            value="${param.key}" 
            data-param-id="${param.id}" 
            data-field="key"
            placeholder="Parameter key"
          />
        </td>
        <td>
          <input 
            type="text" 
            class="parameter-input" 
            value="${param.value}" 
            data-param-id="${param.id}" 
            data-field="value"
            placeholder="Parameter value"
          />
        </td>
        <td>
          <button 
            class="delete-parameter-btn" 
            data-param-id="${param.id}" 
            title="Delete Parameter"
          >×</button>
        </td>
      </tr>
    `).join('');

    return `
      <table class="parameters-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${parametersRows}
        </tbody>
      </table>
    `;
  }

  private loadParameters(): void {
    const savedParams = this.context.globalState.get<RouteParameter[]>('nextjsRadar.routeParameters', []);
    this.parameters = savedParams;
  }

  private saveParameters(): void {
    this.context.globalState.update('nextjsRadar.routeParameters', this.parameters);
  }

  private addParameter(): void {
    const newId = Date.now().toString();
    const newParam: RouteParameter = {
      id: newId,
      key: '',
      value: ''
    };
    this.parameters.push(newParam);
    this.saveParameters();
    this.updateView();
  }

  private deleteParameter(id: string): void {
    this.parameters = this.parameters.filter(param => param.id !== id);
    this.saveParameters();
    this.updateView();
  }

  private updateParameter(id: string, key: string, value: string): void {
    const param = this.parameters.find(p => p.id === id);
    if (param) {
      param.key = key;
      param.value = value;
      this.saveParameters();
    }
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
