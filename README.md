# Next.js Radar 🔍

A powerful Visual Studio Code extension designed to streamline your Next.js App Router development experience. Visualize and navigate your project's routing structure with ease.

![Next.js Radar Icon](media/nextjs_radar_icon_128.png)

## 🎯 Features

### Route Visualization
- **Hierarchical & Flat Views**: Switch between tree and flat representations of your route structure
- **Smart Route Detection**: Automatically detects all Next.js App Router patterns
- **Categorized Display**: Group routes by type (Pages, Layouts, API Routes, etc.)
- **Search & Filter**: Quickly find routes by path, filename, or file type

### Next.js App Router Support
- **Complete Pattern Coverage**: Supports all Next.js 13+ App Router conventions
  - `page.tsx/js` - Page components
  - `layout.tsx/js` - Layout components  
  - `loading.tsx/js` - Loading UI
  - `error.tsx/js` - Error pages
  - `not-found.tsx/js` - 404 pages
  - `route.ts/js` - API routes
  - `template.tsx/js` - Template components
  - `default.tsx/js` - Default pages (parallel routes)
  - `global-error.tsx/js` - Global error handlers

### Advanced Routing Features
- **Dynamic Segments**: `[id]`, `[slug]` 
- **Catch-all Routes**: `[...slug]`, `[[...slug]]`
- **Route Groups**: `(marketing)`, `(auth)`
- **Parallel Routes**: `@auth`, `@dashboard`
- **Intercepting Routes**: `(..)`, `(...)`, `(....)`

### Developer Tools
- **Browser Integration**: Open routes directly in your browser
- **Page Content Navigation**: Browse component structure within files
- **Route Parameters View**: Visualize dynamic route parameters
- **Copy Route Paths**: Quick clipboard access to route paths
- **Configurable Host URLs**: Support for custom development server configurations

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Next.js Radar"
4. Click Install

### From VSIX
1. Download the `.vsix` file from releases
2. Open VS Code
3. Run `Extensions: Install from VSIX...` from Command Palette
4. Select the downloaded file

## 🚀 Getting Started

### Automatic Activation
Next.js Radar automatically activates when it detects:
- `next.config.js` file in workspace
- `package.json` with `next` dependency
- `src/app` or `app` directory structure

### Views & Panels
After activation, you'll find Next.js Radar in the Explorer sidebar with these views:
- **Routes**: Main route visualization with search capabilities
- **Page Content**: Navigate component structure within open files
- **Route Parameters**: View and manage dynamic route parameters

## ⚙️ Configuration

### VS Code Settings
Configure Next.js Radar through VS Code settings (`Ctrl+,` / `Cmd+,`):

```json
{
  "nextjsRadar.viewType": "hierarchical",           // or "flat"
  "nextjsRadar.sortingType": "natural",            // or "basic"  
  "nextjsRadar.showFileExtensions": false,         // Show/hide file extensions
  "nextjsRadar.groupByType": true,                 // Group by file type
  "nextjsRadar.categorizeRoot": true,              // Show categories at root level
  "nextjsRadar.hostUrl": "http://localhost:3000"   // Development server URL
}
```

### Workspace Configuration
Create `.vscode/nextjs-radar.json` for project-specific settings:

```json
{
  "projectRoot": "./",
  "appDirectory": "src/app",
  "port": 3000,
  "enablePageContentView": true,
  "excludePatterns": [
    "**/node_modules/**",
    "**/.next/**"
  ],
  "hostUrl": "http://localhost:3000"
}
```

## 🎮 Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Next.js Radar: Refresh Routes` | Refresh route tree | - |
| `Next.js Radar: Toggle View Type` | Switch between hierarchical/flat | - |
| `Next.js Radar: Toggle Sorting Type` | Switch between natural/basic sorting | - |
| `Next.js Radar: Search Routes` | Search through routes | - |
| `Next.js Radar: Clear Search` | Clear search filter | - |
| `Next.js Radar: Open in Browser` | Open route in browser | - |
| `Next.js Radar: Copy Path` | Copy route path to clipboard | - |
| `Next.js Radar: Open Route from URL` | Open file from URL | - |

## 🔄 Usage Examples

### Navigation Workflow
1. **Browse Routes**: Use the Routes view to explore your app structure
2. **Search Routes**: Use the search functionality to quickly find specific routes
3. **Open Files**: Click on any route to open the corresponding file
4. **Preview in Browser**: Right-click routes to open them in your browser

### Route Organization
- **Hierarchical View**: See your routes organized as a tree structure
- **Flat View**: View all routes in a linear list with indentation
- **Categories**: Group routes by type (Pages, Layouts, API Routes, etc.)
- **Sorting**: Use natural sorting for numbered routes or basic alphabetical

### Development Integration
- **Live Updates**: Routes automatically refresh when files change
- **Multiple Views**: Navigate both route structure and page content simultaneously  
- **Browser Preview**: Test routes directly from the extension
- **Custom URLs**: Configure development server URLs for different environments

## 🏗️ Development

### Prerequisites
- Node.js (LTS version)
- VS Code
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/nextjs-radar.git
cd nextjs-radar

# Install dependencies
npm install

# Start development mode
npm run watch
```

### Development Commands
```bash
npm run compile          # Compile TypeScript
npm run watch           # Watch mode for development
npm run test            # Run tests
npm run package         # Build for production
npm run lint            # Run ESLint
npm run check-types     # TypeScript type checking
```

### Testing
```bash
# Run all tests
npm test

# Create test fixtures
npm run create-test-fixtures

# Compile tests
npm run compile-tests
```

### Extension Development
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new VS Code window
4. Use `Ctrl/Cmd + R` to reload the extension

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain test coverage for new features
3. Update documentation for user-facing changes
4. Follow the existing code style and patterns

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the routing visualization needs of Next.js App Router development
- Built on the proven architecture patterns from Svelte Radar extension
- Thanks to the VS Code extension development community

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/your-username/nextjs-radar/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/your-username/nextjs-radar/issues)
- **Documentation**: [GitHub Wiki](https://github.com/your-username/nextjs-radar/wiki)

---

**Happy coding with Next.js Radar!** 🚀