import * as vscode from 'vscode';

interface RouteParameter {
  id: string;
  key: string;
  value: string;
}

export class RouteParametersProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'nextjsRadar.routeParameters';
  private _view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private parameters: RouteParameter[] = [];
  private isExpanded = true;

  constructor(private context: vscode.ExtensionContext) {
    // Load saved parameters
    this.loadParameters();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true
    };

    // Set initial HTML
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(msg => {
      switch (msg.type) {
        case 'toggle-expand':
          this.toggleExpanded();
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

  private toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.context.globalState.update('nextjsRadar.parametersExpanded', this.isExpanded);
    this.updateView();
  }

  private loadParameters(): void {
    const savedParams = this.context.globalState.get<RouteParameter[]>('nextjsRadar.routeParameters', []);
    const savedExpanded = this.context.globalState.get<boolean>('nextjsRadar.parametersExpanded', true);
    this.parameters = savedParams;
    this.isExpanded = savedExpanded;
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

  private updateView(): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateParameters',
        parameters: this.parameters,
        isExpanded: this.isExpanded
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
  padding: 8px; 
  margin: 0; 
  font-family: var(--vscode-font-family); 
  color: var(--vscode-foreground); 
  font-size: 13px;
}

.parameters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 4px;
  cursor: pointer;
  border-radius: 3px;
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
}

.parameters-header:hover {
  background: var(--vscode-list-hoverBackground);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.expand-icon {
  font-size: 12px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.expand-icon.collapsed {
  transform: rotate(-90deg);
}

.parameters-title {
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
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.add-parameter-btn:hover {
  background: var(--vscode-button-hoverBackground);
  opacity: 1;
}

.parameters-content {
  transition: all 0.3s ease;
  overflow: hidden;
}

.parameters-content.collapsed {
  max-height: 0;
  opacity: 0;
}

.parameters-content.expanded {
  max-height: 1000px;
  opacity: 1;
}

.parameters-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
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
  padding: 4px 6px;
  font-size: 12px;
  min-height: 18px;
}

.parameter-input:focus {
  outline: 1px solid var(--vscode-focusBorder);
}

.delete-parameter-btn {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  border: 1px solid var(--vscode-errorForeground);
  background: transparent;
  color: var(--vscode-errorForeground);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.delete-parameter-btn:hover {
  background: var(--vscode-errorForeground);
  color: var(--vscode-errorBackground);
}

.parameters-empty {
  padding: 20px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  font-style: italic;
  background: var(--vscode-editor-background);
  border-radius: 4px;
  border: 1px dashed var(--vscode-widget-border);
}

.parameter-count {
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
  margin-left: 4px;
}
</style>
</head>
<body>
  <div class="parameters-header" id="header">
    <div class="header-left">
      <span class="expand-icon" id="expand-icon">${this.isExpanded ? '▼' : '▶'}</span>
      <h3 class="parameters-title">Route Parameters</h3>
      <span class="parameter-count" id="param-count">(${this.parameters.length})</span>
    </div>
    <button id="add-parameter" class="add-parameter-btn" title="Add Parameter">+</button>
  </div>
  
  <div class="parameters-content ${this.isExpanded ? 'expanded' : 'collapsed'}" id="content">
    <div id="parameters-container">${this.getParametersHtml()}</div>
  </div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();

// Header click to toggle expand/collapse
document.getElementById('header').addEventListener('click', (e) => {
  // Don't toggle if clicking on add button
  if (e.target.id === 'add-parameter' || e.target.closest('#add-parameter')) {
    return;
  }
  vscode.postMessage({ type: 'toggle-expand' });
});

// Add parameter button
document.getElementById('add-parameter').addEventListener('click', (e) => {
  e.stopPropagation();
  vscode.postMessage({ type: 'add-parameter' });
});

// Parameter input event listeners
document.addEventListener('input', (e) => {
  if (e.target.classList.contains('parameter-input')) {
    const paramId = e.target.dataset.paramId;
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

// Delete parameter button
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-parameter-btn')) {
    const paramId = e.target.dataset.paramId;
    vscode.postMessage({ type: 'delete-parameter', id: paramId });
  }
});

// Handle updates from extension
window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'updateParameters') {
    updateParametersDisplay(message.parameters, message.isExpanded);
  }
});

function updateParametersDisplay(parameters, isExpanded) {
  // Update expand icon
  const expandIcon = document.getElementById('expand-icon');
  expandIcon.textContent = isExpanded ? '▼' : '▶';
  expandIcon.className = \`expand-icon \${isExpanded ? '' : 'collapsed'}\`;
  
  // Update parameter count
  document.getElementById('param-count').textContent = \`(\${parameters.length})\`;
  
  // Update content visibility
  const content = document.getElementById('content');
  content.className = \`parameters-content \${isExpanded ? 'expanded' : 'collapsed'}\`;
  
  // Update parameters container
  document.getElementById('parameters-container').innerHTML = getParametersHtml(parameters);
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
          <th></th>
        </tr>
      </thead>
      <tbody>
        \${parametersRows}
      </tbody>
    </table>
  \`;
}

// Initialize with current data
updateParametersDisplay(${JSON.stringify(this.parameters)}, ${this.isExpanded});
</script>
</body>
</html>`;
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${parametersRows}
        </tbody>
      </table>
    `;
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}