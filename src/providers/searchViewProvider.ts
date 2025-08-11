import * as vscode from 'vscode';
import { NextjsRoutesProvider } from './routesProvider';

export class NextjsSearchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'nextjsRadar.search';
  private _view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];

  constructor(private routesProvider: NextjsRoutesProvider, private context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(msg => {
      switch (msg.type) {
        case 'search':
          this.routesProvider.applySearch(msg.value || '');
          break;
        case 'clear':
          this.routesProvider.applySearch('');
          this.postMessage({ type: 'reset' });
          break;
      }
    }, undefined, this.disposables);
  }

  private getHtml(): string {
    const nonce = Date.now().toString();
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<style>
body { padding: 6px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); }
input { width: 100%; padding:4px 6px; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border:1px solid var(--vscode-input-border, var(--vscode-editorWidget-border)); border-radius:4px; }
input:focus { outline:1px solid var(--vscode-focusBorder); }
.clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); cursor:pointer; color: var(--vscode-icon-foreground); }
.wrapper { position:relative; }
</style>
</head>
<body>
  <div class="wrapper">
    <input id="search" type="text" placeholder="경로/파일/타입 검색..." aria-label="Search Next.js routes" />
    <span class="clear" title="Clear" id="clear">✕</span>
  </div>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const input = document.getElementById('search');
const clearBtn = document.getElementById('clear');
let lastVal = '';
function send(val){ vscode.postMessage({ type: 'search', value: val }); }
input.addEventListener('input', e => { const v = input.value; if(v === lastVal) return; lastVal = v; send(v); });
input.addEventListener('keydown', e => { if(e.key === 'Escape'){ input.value=''; lastVal=''; send(''); }});
clearBtn.addEventListener('click', () => { input.value=''; lastVal=''; send(''); input.focus(); });
window.addEventListener('message', event => { const msg = event.data; if(msg.type==='reset'){ input.value=''; lastVal=''; }});
</script>
</body>
</html>`;
  }

  private postMessage(message: any) {
    this._view?.webview.postMessage(message);
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
