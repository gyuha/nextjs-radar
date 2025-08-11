import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Get workspace root path
 */
export function getWorkspaceRoot(): string | null {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }
  return null;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is a directory
 */
export async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read file content
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Write file content
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    await fs.promises.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Get file extension
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Check if file has valid TypeScript/JavaScript extension
 */
export function hasValidExtension(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

/**
 * Get relative path from workspace root
 */
export function getRelativePath(filePath: string, workspaceRoot?: string): string {
  const root = workspaceRoot || getWorkspaceRoot();
  if (!root) {
    return filePath;
  }
  return path.relative(root, filePath);
}

/**
 * Normalize path separators for cross-platform compatibility
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Join paths with proper separators
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get directory name from file path
 */
export function getDirectoryName(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get base name (filename without extension)
 */
export function getBaseName(filePath: string, includeExtension: boolean = false): string {
  return includeExtension ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
}

/**
 * Create VS Code URI from file path
 */
export function createUri(filePath: string): vscode.Uri {
  return vscode.Uri.file(filePath);
}

/**
 * Open file in VS Code editor
 */
export async function openFile(filePath: string, line?: number, column?: number): Promise<void> {
  const uri = createUri(filePath);
  const options: vscode.TextDocumentShowOptions = {
    preview: false
  };
  
  if (line !== undefined) {
    options.selection = new vscode.Range(
      new vscode.Position(line, column || 0),
      new vscode.Position(line, column || 0)
    );
  }
  
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document, options);
}

/**
 * Show file in explorer/finder
 */
export async function revealInFileExplorer(filePath: string): Promise<void> {
  const uri = createUri(filePath);
  await vscode.commands.executeCommand('revealFileInOS', uri);
}

/**
 * Copy file path to clipboard
 */
export async function copyPathToClipboard(filePath: string, relative: boolean = true): Promise<void> {
  const pathToCopy = relative ? getRelativePath(filePath) : filePath;
  await vscode.env.clipboard.writeText(pathToCopy);
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<fs.Stats | null> {
  try {
    return await fs.promises.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * Watch file changes
 */
export function watchFile(filePath: string, callback: (eventType: string, filename?: string | null) => void): fs.FSWatcher {
  return fs.watch(filePath, callback);
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, check if it's actually a directory
    if (!(await isDirectory(dirPath))) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }
}

/**
 * Delete file if exists
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get files in directory matching pattern
 */
export async function getFilesInDirectory(
  dirPath: string, 
  pattern?: RegExp,
  recursive: boolean = false
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isFile()) {
        if (!pattern || pattern.test(entry.name)) {
          files.push(fullPath);
        }
      } else if (entry.isDirectory() && recursive) {
        const subFiles = await getFilesInDirectory(fullPath, pattern, recursive);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}