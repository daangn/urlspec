# URLSpec for Visual Studio Code

> Syntax highlighting, validation, and language server support for `.urlspec` files

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

The URLSpec VS Code extension provides rich language support for `.urlspec` files, including syntax highlighting, real-time validation, and IntelliSense features. Built on the Language Server Protocol (LSP) using Langium, it offers a seamless editing experience for URLSpec documents.

## Features

### ✅ Currently Available

- **Syntax Highlighting**: Full TextMate grammar support for URLSpec syntax
- **Real-time Validation**: Instant error detection and diagnostics
- **Document Outline**: Navigate your URLSpec structure with the document outline view
- **Bracket Matching**: Auto-closing and matching for brackets, parentheses, and quotes
- **Comment Support**: Line comments with `//`
- **Region Folding**: Fold/unfold code sections with `// #region` and `// #endregion`
- **Smart Indentation**: Automatic indentation for blocks

### 🚧 Planned Features

- **Auto-completion**: IntelliSense for parameter types, endpoints, and page definitions
- **Hover Documentation**: View type information and descriptions on hover
- **Go to Definition**: Navigate to parameter type definitions
- **Find References**: Find all usages of a parameter type or page
- **Rename Symbol**: Safely rename parameters and pages across your document
- **Code Formatting**: Auto-format `.urlspec` files

## Installation

### From VS Code Marketplace (When Published)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "URLSpec"
4. Click Install

### From Source

```bash
# Clone the repository
git clone https://github.com/daangn/urlspec.git
cd urlspec

# Install dependencies
yarn install

# Build all packages
yarn build

# Package the extension
cd packages/urlspec-vscode-extension
yarn build

# Install the .vsix file
code --install-extension urlspec-vscode-extension-0.0.0.vsix
```

## Usage

### Basic Editing

Once installed, the extension automatically activates when you open a `.urlspec` file.

**Create a new file:**

1. Create a file with the `.urlspec` extension (e.g., `api.urlspec`)
2. Start typing - syntax highlighting will activate automatically

**Example:**

```urlspec
namespace "jobs";

endpoint alpha = "https://jobs.alpha.example.com";
endpoint production = "https://jobs.example.com";

param sort_order = "recent" | "popular" | "trending";
param job_status = "active" | "closed" | "draft";

global {
  referrer?: "jobs" | "hello";
  utm_source?: string;
}

page list = /jobs {
  category?: string;
  sort: sort_order;
}

page detail = /jobs/:job_id {
  job_id: string;
  preview?: boolean;
  status?: job_status;
}
```

### Validation

The extension provides real-time validation as you type:

- **Syntax errors**: Highlighted immediately with red underlines
- **Semantic errors**: Type mismatches, undefined references, duplicate names
- **Warnings**: Best practice suggestions

**Common errors detected:**

- Missing namespace declaration
- Invalid URL format in endpoints
- Undefined parameter type references
- Duplicate page or parameter names
- Mismatched path parameter declarations

### Document Outline

Use the Outline view to navigate your URLSpec structure:

1. Open the Outline panel (View → Outline or Ctrl+Shift+O)
2. See all pages, parameters, and endpoints
3. Click any item to jump to its definition

### Code Folding

Fold sections of your URLSpec for better readability:

```urlspec
// #region Global Parameters
global {
  utm_source?: string;
  utm_campaign?: string;
  referrer?: string;
}
// #endregion

// #region Product Pages
page products = /products {
  category?: string;
}

page product_detail = /products/:product_id {
  product_id: string;
}
// #endregion
```

Click the folding arrows in the gutter or use:
- Fold: Ctrl+Shift+[ (Cmd+Shift+[ on Mac)
- Unfold: Ctrl+Shift+] (Cmd+Shift+] on Mac)
- Fold All: Ctrl+K Ctrl+0
- Unfold All: Ctrl+K Ctrl+J

### Comments

Add comments to document your URLSpec:

```urlspec
namespace "api";

// Production endpoint for public API
endpoint production = "https://api.example.com";

// User-related pages
page users_list = /api/v1/users {
  // Pagination parameters
  page?: number;
  limit?: number;
}
```

### Smart Indentation

The extension automatically indents code blocks:

```urlspec
namespace "example";

page home = /home {
  // Indented automatically
  param1: string;
  param2?: boolean;
}
```

## Language Configuration

The extension includes smart editing features:

### Auto-Closing Pairs

When you type an opening character, the closing character is automatically inserted:

- `{` → `{}`
- `[` → `[]`
- `(` → `()`
- `<` → `<>`
- `"` → `""`

### Bracket Matching

Matching brackets are highlighted when you place your cursor next to them.

### Surrounding Pairs

Select text and press a bracket/quote character to surround the selection.

## Syntax Highlighting

The extension provides rich syntax highlighting:

| Element | Color |
|---------|-------|
| Keywords (`namespace`, `endpoint`, `param`, `page`, `global`) | Blue/Purple |
| Strings | Green |
| Path segments (`/jobs`, `:job_id`) | Orange |
| Type names (`string`, `number`, `boolean`) | Cyan |
| Operators (`=`, `\|`, `:`, `?`) | White/Gray |
| Comments | Gray/Green (italic) |
| Parameter names | Light Blue |

**Themes may vary** based on your VS Code color theme.

## Extension Settings

Currently, the extension works out of the box with no configuration required.

### Future Settings (Planned)

- `urlspec.validation.enabled`: Enable/disable validation
- `urlspec.completion.enabled`: Enable/disable auto-completion
- `urlspec.trace.server`: Trace Language Server communication for debugging

## Development

### Prerequisites

- Node.js 18+
- Yarn 4.12.0+
- VS Code 1.80.0+

### Setup

```bash
# Clone the repository
git clone https://github.com/daangn/urlspec.git
cd urlspec

# Install dependencies
yarn install

# Build the language package (required)
cd packages/language
yarn build

# Build the extension
cd ../urlspec-vscode-extension
yarn build
```

### Running in Development Mode

1. Open the URLSpec repository in VS Code
2. Go to the `packages/urlspec-vscode-extension` folder
3. Press F5 to launch the Extension Development Host
4. Open or create a `.urlspec` file in the new window
5. Test your changes

### Watch Mode

```bash
cd packages/urlspec-vscode-extension
yarn watch
```

This will rebuild the extension automatically when you make changes.

### Building the Extension Package

```bash
cd packages/urlspec-vscode-extension
yarn build
```

This generates a `.vsix` file in the `packages/urlspec-vscode-extension` directory.

### Installing Locally

```bash
code --install-extension urlspec-vscode-extension-0.0.0.vsix
```

## Architecture

```
┌─────────────────────────────────────┐
│       VS Code Extension Host        │
└──────────────┬──────────────────────┘
               │
               │ Activates extension
               │
        ┌──────▼──────────────┐
        │  Extension Client   │
        │  (extension.ts)     │
        └──────┬──────────────┘
               │
               │ Spawns & communicates via LSP
               │
        ┌──────▼──────────────┐
        │  Language Server    │
        │  (Langium-based)    │
        └──────┬──────────────┘
               │
               │ Uses
               │
        ┌──────▼──────────────┐
        │  @urlspec/language  │
        │  (Parser, Validator)│
        └─────────────────────┘
```

### Key Components

1. **Extension Client** (`extension.ts`): Activates the extension and starts the language server
2. **Language Server**: Provides LSP features (diagnostics, completion, etc.)
3. **TextMate Grammar** (`syntaxes/urlspec.tmLanguage.json`): Syntax highlighting
4. **Language Configuration** (`language-configuration.json`): Bracket matching, indentation, etc.

### Language Server Protocol

The extension uses LSP for communication between VS Code and the language server:

- **Diagnostics**: Real-time error/warning messages
- **Document Symbols**: Outline view
- **Completion** (planned): Auto-completion suggestions
- **Hover** (planned): Documentation on hover
- **Definition** (planned): Go to definition

## Troubleshooting

### Extension Not Activating

1. Check that the file has a `.urlspec` extension
2. Reload VS Code: Ctrl+Shift+P → "Developer: Reload Window"
3. Check the Output panel: View → Output → "URLSpec Language Server"

### Syntax Highlighting Not Working

1. Verify the file extension is `.urlspec`
2. Check that the extension is installed: Extensions → "URLSpec"
3. Try reloading the window

### Validation Errors Not Showing

1. Check the Output panel for Language Server errors
2. Ensure `@urlspec/language` is properly built
3. Try disabling and re-enabling the extension

### Performance Issues

For large URLSpec files (>1000 lines):

1. Consider splitting into multiple files (future feature)
2. Check the Output panel for Language Server errors
3. Report performance issues on GitHub

## Contributing

Contributions are welcome! Please see the [root repository README](../../README.md) for contribution guidelines.

### Areas for Contribution

- Auto-completion implementation
- Hover documentation
- Go to definition/references
- Code formatting
- Additional validation rules
- Testing

## Related Packages

- [@urlspec/language](../language) - Core language implementation (used by this extension)
- [@urlspec/builder](../builder) - Programmatic API

## Resources

- [Langium Documentation](https://langium.org/)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [TextMate Grammars](https://macromates.com/manual/en/language_grammars)

## License

MIT License - see [LICENSE](../../LICENSE) for details

## Acknowledgments

Built with:
- [Langium](https://langium.org/) - Language engineering framework
- [VS Code Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [TextMate Grammar](https://macromates.com/manual/en/language_grammars)

---

**Made with ❤️ by the Daangn team**
