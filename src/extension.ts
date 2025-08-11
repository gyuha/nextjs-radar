import * as vscode from 'vscode';
import { NextjsRoutesProvider, PageContentProvider } from './providers';
import { getWorkspaceRoot, isNextjsProject } from './utils';

let routesProvider: NextjsRoutesProvider | undefined;
let pageContentProvider: PageContentProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
	console.log('Next.js Radar extension is starting...');

	// Check if current workspace is a Next.js project
	const workspaceRoot = getWorkspaceRoot();
	if (!workspaceRoot) {
		console.log('No workspace folder found');
		return;
	}

	if (!(await isNextjsProject(workspaceRoot))) {
		console.log('Not a Next.js project, extension will not activate');
		return;
	}

	console.log('Next.js project detected, initializing Next.js Radar...');

	try {
		// Initialize providers
		routesProvider = new NextjsRoutesProvider(context);
		pageContentProvider = new PageContentProvider(context);

		// Register tree views
		const routesTreeView = vscode.window.createTreeView('nextjsRadar.routes', {
			treeDataProvider: routesProvider,
			showCollapseAll: true
		});

		const pageContentTreeView = vscode.window.createTreeView('nextjsRadar.pageContent', {
			treeDataProvider: pageContentProvider,
			showCollapseAll: true
		});


		// Register commands
		registerCommands(context, routesProvider, pageContentProvider);

		// Register disposables
		context.subscriptions.push(
			routesTreeView,
			pageContentTreeView,
			routesProvider,
			pageContentProvider
		);

		console.log('Next.js Radar successfully activated!');

		// Show welcome message
		vscode.window.showInformationMessage('Next.js Radar is now active! Check the Explorer panel.');

	} catch (error) {
		console.error('Failed to activate Next.js Radar:', error);
		vscode.window.showErrorMessage(`Failed to activate Next.js Radar: ${error}`);
	}
}

function registerCommands(
	context: vscode.ExtensionContext,
	routesProvider: NextjsRoutesProvider,
	pageContentProvider: PageContentProvider
) {
	// Refresh routes command
	const refreshRoutesCommand = vscode.commands.registerCommand('nextjsRadar.refreshRoutes', () => {
		routesProvider.refresh();
	});

	// Refresh page content command
	const refreshPageContentCommand = vscode.commands.registerCommand('nextjsRadar.refreshPageContent', () => {
		pageContentProvider.refresh();
	});

	// Toggle view type command
	const toggleViewTypeCommand = vscode.commands.registerCommand('nextjsRadar.toggleViewType', () => {
		const config = routesProvider.getConfiguration();
		const newViewType = config.viewType === 'hierarchical' ? 'flat' : 'hierarchical';
		routesProvider.setViewType(newViewType);
		vscode.window.showInformationMessage(`View switched to ${newViewType}`);
	});

	// Toggle sorting type command
	const toggleSortingCommand = vscode.commands.registerCommand('nextjsRadar.toggleSorting', () => {
		const config = routesProvider.getConfiguration();
		const newSortingType = config.sortingType === 'natural' ? 'basic' : 'natural';
		routesProvider.setSortingType(newSortingType);
		vscode.window.showInformationMessage(`Sorting switched to ${newSortingType}`);
	});

	// Open route in browser command
	const openInBrowserCommand = vscode.commands.registerCommand('nextjsRadar.openInBrowser', async (routeItem) => {
		if (routeItem && routeItem.path) {
			const config = routesProvider.getConfiguration();
			const url = `http://localhost:${config.port}${routeItem.path}`;
			await vscode.env.openExternal(vscode.Uri.parse(url));
		}
	});

	// Copy route path command
	const copyPathCommand = vscode.commands.registerCommand('nextjsRadar.copyPath', async (routeItem) => {
		if (routeItem && routeItem.path) {
			await vscode.env.clipboard.writeText(routeItem.path);
			vscode.window.showInformationMessage('Route path copied to clipboard');
		}
	});

	// Search routes command
	const searchRoutesCommand = vscode.commands.registerCommand('nextjsRadar.searchRoutes', async () => {
		const current = '';
		const query = await vscode.window.showInputBox({
			prompt: 'Search routes',
			placeHolder: '경로 / 파일명 / 타입 검색',
			value: current
		});
		if (query !== undefined) {
			routesProvider.applySearch(query);
		}
	});

	// Clear search command
	const clearSearchCommand = vscode.commands.registerCommand('nextjsRadar.clearSearch', () => {
		routesProvider.applySearch('');
		vscode.window.showInformationMessage('Search cleared');
	});

	// Open route from URL command
	const openRouteFromUrlCommand = vscode.commands.registerCommand('nextjsRadar.openRouteFromUrl', async () => {
		const url = await vscode.window.showInputBox({
			prompt: 'Enter Next.js route URL',
			placeHolder: 'http://localhost:3000/blog/my-post'
		});

		if (url) {
			// TODO: Implement URL to route matching
			vscode.window.showInformationMessage(`Looking for route matching: ${url}`);
		}
	});

	// Register all commands
	context.subscriptions.push(
		refreshRoutesCommand,
		refreshPageContentCommand,
		toggleViewTypeCommand,
		toggleSortingCommand,
		openInBrowserCommand,
		copyPathCommand,
		searchRoutesCommand,
		clearSearchCommand,
		openRouteFromUrlCommand
	);
}

export function deactivate() {
	console.log('Next.js Radar is deactivating...');
	
	// Cleanup is handled by VS Code disposing the context subscriptions
	routesProvider = undefined;
	pageContentProvider = undefined;
}