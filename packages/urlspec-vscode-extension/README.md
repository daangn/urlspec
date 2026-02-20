# URLSpec for Visual Studio Code

> Syntax highlighting, validation, and language server support for `.urlspec` files

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Features

- **Syntax Highlighting**: Full TextMate grammar support for URLSpec syntax
- **Real-time Validation**: Instant error detection and diagnostics
- **Document Outline**: Navigate your URLSpec structure with the outline view
- **Bracket Matching & Auto-closing**: Auto-closing pairs for brackets and quotes
- **Comment Support**: Line comments with `//`
- **Region Folding**: Fold/unfold sections with `// #region` and `// #endregion`

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "URLSpec"
4. Click Install

## Usage

Create a file with the `.urlspec` extension — the extension activates automatically.

```urlspec
// Parameter type definitions (camelCase)
param sortOrder = "recent" | "popular" | "trending";
param jobStatus = "active" | "closed";

// Global parameters applied to all pages
global {
  utm_source?: string;
  referrer?: string;
}

// Page definitions (camelCase name)
page list = /jobs {
  sort?: sortOrder;
  category?: string;
}

page detail = /jobs/:jobId {
  jobId: string;
  status?: jobStatus;
}

// Numeric path segments are supported
page notFound = /404 {}
```

## Related Packages

- [@urlspec/language](../language) - Core language implementation
- [@urlspec/builder](../builder) - Programmatic API

## License

MIT
