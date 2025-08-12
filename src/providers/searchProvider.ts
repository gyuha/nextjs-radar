import * as vscode from 'vscode';

export class SearchViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'nextjsRadar.searchInput';
    private _view?: vscode.WebviewView;
    private _onSearchChange: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    public readonly onSearchChange: vscode.Event<string> = this._onSearchChange.event;

    constructor(private readonly _extensionContext: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionContext.extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'search':
                    this._onSearchChange.fire(data.value);
                    break;
                case 'clear':
                    this._onSearchChange.fire('');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Search Routes</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 8px;
                    }
                    .search-container {
                        position: relative;
                        width: 100%;
                    }
                    .search-input {
                        width: 100%;
                        padding: 6px 30px 6px 8px;
                        border: 1px solid var(--vscode-input-border);
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        border-radius: 2px;
                        outline: none;
                    }
                    .search-input:focus {
                        border-color: var(--vscode-focusBorder);
                        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
                    }
                    .search-input::placeholder {
                        color: var(--vscode-input-placeholderForeground);
                    }
                    .clear-button {
                        position: absolute;
                        right: 6px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: none;
                        border: none;
                        color: var(--vscode-icon-foreground);
                        cursor: pointer;
                        font-size: 14px;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    }
                    .clear-button:hover {
                        opacity: 1;
                        background: var(--vscode-toolbar-hoverBackground);
                        border-radius: 2px;
                    }
                    .clear-button.hidden {
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="search-container">
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="🔍 검색어 입력..." 
                        id="searchInput"
                        autocomplete="off"
                    >
                    <button class="clear-button hidden" id="clearButton" title="Clear search">×</button>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    const searchInput = document.getElementById('searchInput');
                    const clearButton = document.getElementById('clearButton');
                    
                    let searchTimeout;
                    
                    function handleSearch() {
                        clearTimeout(searchTimeout);
                        searchTimeout = setTimeout(() => {
                            const value = searchInput.value.trim();
                            vscode.postMessage({
                                type: 'search',
                                value: value
                            });
                            
                            if (value) {
                                clearButton.classList.remove('hidden');
                            } else {
                                clearButton.classList.add('hidden');
                            }
                        }, 150); // Debounce for 150ms
                    }
                    
                    searchInput.addEventListener('input', handleSearch);
                    searchInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            searchInput.value = '';
                            handleSearch();
                        }
                    });
                    
                    clearButton.addEventListener('click', () => {
                        searchInput.value = '';
                        searchInput.focus();
                        vscode.postMessage({
                            type: 'clear'
                        });
                        clearButton.classList.add('hidden');
                    });
                    
                    // Focus the input when the view is shown
                    window.addEventListener('focus', () => {
                        searchInput.focus();
                    });
                    
                    // Initial focus
                    setTimeout(() => searchInput.focus(), 100);
                </script>
            </body>
            </html>`;
    }

    public updateSearch(query: string) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'updateSearch', value: query });
        }
    }
}