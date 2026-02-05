# @urlspec/language

> Core language implementation for URLSpec, built with Langium

[![npm version](https://img.shields.io/npm/v/@urlspec/language.svg)](https://www.npmjs.com/package/@urlspec/language)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

`@urlspec/language` is the core package that implements the URLSpec domain-specific language. It provides parsing, validation, and resolution capabilities for `.urlspec` files, built on the powerful [Langium](https://langium.org/) framework.

## Features

- **Parse URLSpec files**: Convert `.urlspec` text into structured AST
- **Type-safe resolution**: Transform AST into developer-friendly resolved structures
- **Validation**: Catch syntax and semantic errors
- **Pretty printing**: Generate formatted `.urlspec` text from AST
- **Langium services**: Expose language services for IDE integration

## Installation

```bash
# npm
npm install @urlspec/language

# yarn
yarn add @urlspec/language

# pnpm
pnpm add @urlspec/language
```

## Usage

### Basic Parsing

```typescript
import { parse } from '@urlspec/language';

const urlspecContent = `
page list = /jobs {
  category?: string;
}
`;

const document = await parse(urlspecContent);

// Access the Langium AST
console.log(document.parseResult.value.pages[0].name); // "list"
```

### Resolved API (Recommended)

The `resolve()` function provides a higher-level API with merged global parameters and resolved type references:

```typescript
import { resolve } from '@urlspec/language';

const spec = resolve(urlspecContent);

// Easier to work with resolved structure
console.log(spec.pages[0].name); // "list"
console.log(spec.pages[0].path); // "/jobs"
console.log(spec.pages[0].parameters);
// Includes both page-specific and global parameters
```

### Type Definitions

The package exports comprehensive TypeScript types for the resolved structure:

```typescript
import type {
  ResolvedURLSpec,
  ResolvedPage,
  ResolvedParameter,
  ResolvedType,
  ResolvedPathSegment,
} from '@urlspec/language';

function processSpec(spec: ResolvedURLSpec) {
  spec.pages.forEach((page: ResolvedPage) => {
    console.log(`Page: ${page.name}`);
    console.log(`Path: ${page.path}`);

    page.pathSegments.forEach((segment: ResolvedPathSegment) => {
      if (segment.kind === 'dynamic') {
        console.log(`  Dynamic param: ${segment.name}`);
      }
    });

    Object.entries(page.parameters).forEach(([name, param]) => {
      console.log(`  Query param: ${name} (${param.optional ? 'optional' : 'required'})`);
    });
  });
}
```

## API Reference

### `parse(input: string): Promise<URLSpecDocument>`

Parses URLSpec text into a Langium document with AST.

**Parameters:**
- `input` - URLSpec source code as a string

**Returns:**
- Promise resolving to a `URLSpecDocument` containing the Langium AST

**Example:**
```typescript
const document = await parse(`
page home = /home {
  query?: string;
}
`);

const ast = document.parseResult.value;
console.log(ast.pages[0].name); // "home"
console.log(ast.pages[0].parameters[0].name); // "query"
```

### `resolve(input: string): ResolvedURLSpec`

Parses and resolves URLSpec into a developer-friendly structure with:
- Global parameters merged into each page
- Type references resolved to actual types
- Path segments parsed and categorized

**Parameters:**
- `input` - URLSpec source code as a string

**Returns:**
- `ResolvedURLSpec` object with fully resolved structure

**Example:**
```typescript
const spec = resolve(`
param category = "electronics" | "clothing" | "food";

global {
  utm_source?: string;
}

page products = /products {
  cat: category;
}
`);

console.log(spec.paramTypes[0]);
// { name: 'category', type: { kind: 'union', values: ['electronics', 'clothing', 'food'] } }

const productsPage = spec.pages[0];
console.log(productsPage.parameters.cat.type);
// Resolved to actual union type, not a reference
console.log(productsPage.parameters.utm_source);
// Global parameter merged into page
```

### `print(urlSpec: URLSpecModel): string`

Converts a Langium AST back to formatted URLSpec text.

**Parameters:**
- `urlSpec` - The Langium AST model to print

**Returns:**
- Formatted URLSpec source code as a string

**Example:**
```typescript
import { parse, print } from '@urlspec/language';

const document = await parse('page home = /home { query?: string; }');
const ast = document.parseResult.value;

const formatted = print(ast);
console.log(formatted);
// Output:
// page home = /home {
//   query?: string;
// }
```

### `createURLSpecServices(context?: DefaultSharedModuleContext): URLSpecServices`

Creates Langium language services for URLSpec. Used primarily for language server and IDE integration.

**Parameters:**
- `context` - Optional Langium module context

**Returns:**
- `URLSpecServices` object with Langium services

## Type Reference

### `ResolvedURLSpec`

Top-level resolved structure representing an entire URLSpec document.

```typescript
interface ResolvedURLSpec {
  endpoint?: string;
  paramTypes: ResolvedParamType[];
  globalParameters: ResolvedParameter[];
  pages: ResolvedPage[];
}
```

### `ResolvedPage`

Represents a single page definition with resolved parameters.

```typescript
interface ResolvedPage {
  name: string;
  path: string;
  pathSegments: ResolvedPathSegment[];
  parameters: ResolvedParameter[];
  description?: string;
}
```

### `ResolvedParameter`

Represents a query or path parameter with its type and optionality.

```typescript
interface ResolvedParameter {
  name: string;
  optional: boolean;
  type: ResolvedType;
}
```

### `ResolvedType`

Union type representing all possible parameter types.

```typescript
type ResolvedType =
  | { kind: 'string' }
  | { kind: 'literal'; value: string }
  | { kind: 'union'; values: string[] };
```

### `ResolvedPathSegment`

Represents a segment of a URL path.

```typescript
type ResolvedPathSegment =
  | { kind: 'static'; value: string }
  | { kind: 'dynamic'; name: string };
```

## Two-Level API Design

`@urlspec/language` provides two APIs for different use cases:

### Low-Level API: `parse()`

**Use when you need:**
- Direct access to Langium AST
- Building IDE tools or language servers
- Low-level manipulation of syntax tree
- Custom validation or transformation

**Example:**
```typescript
const doc = await parse(input);
const ast = doc.parseResult.value;

// Direct AST access
ast.pages.forEach(page => {
  console.log(page.$type); // Langium type
  console.log(page.name);
});
```

### High-Level API: `resolve()`

**Use when you need:**
- Simple, flattened data structure
- Type references resolved to actual types
- Global parameters automatically merged
- Building application features

**Example:**
```typescript
const spec = resolve(input);

// Easy access to resolved data
spec.pages.list.parameters.forEach(param => {
  // Type is already resolved, no need to lookup references
  console.log(param.type);
});
```

## Advanced Usage

### Error Handling

```typescript
import { parse } from '@urlspec/language';

const document = await parse(invalidInput);

if (document.parseResult.lexerErrors.length > 0) {
  console.error('Lexer errors:', document.parseResult.lexerErrors);
}

if (document.parseResult.parserErrors.length > 0) {
  console.error('Parser errors:', document.parseResult.parserErrors);
}
```

### Custom Validation

```typescript
import { createURLSpecServices } from '@urlspec/language';

const services = createURLSpecServices();
const validator = services.validation.ValidationRegistry;

// Add custom validation rules
validator.register({
  URLSpecModel(model, accept) {
    if (model.pages.length === 0) {
      accept('warning', 'URLSpec should have at least one page', {
        node: model,
      });
    }
  },
});
```

### Working with Path Segments

```typescript
const spec = resolve(`
page article = /blog/:category/:article_id {
  category: string;
  article_id: string;
}
`);

const articlePage = spec.pages[0];

articlePage.pathSegments.forEach(segment => {
  if (segment.type === 'static') {
    console.log(`Static: ${segment.value}`);
  } else if (segment.type === 'parameter') {
    console.log(`Dynamic: ${segment.value}`);
    // Get the parameter details
    const param = articlePage.parameters.find(p => p.name === segment.value);
    console.log(`  Optional: ${param.optional}`);
  }
});
```

## Language Grammar

URLSpec is defined using Langium grammar. Key syntax elements:

### Parameter Types

```urlspec
param status = "active" | "inactive" | "pending";
param sort_order = "asc" | "desc";
```

### Global Parameters

```urlspec
global {
  utm_source?: string;
  debug?: "true" | "false";
}
```

### Pages

```urlspec
// Static path
page home = /;

// Dynamic path with parameters
page user = /users/:user_id {
  user_id: string;
  tab?: "posts" | "comments" | "likes";
}

// Multiple dynamic segments
page post = /blog/:category/:post_id {
  category: string;
  post_id: string;
  preview?: "true" | "false";
}
```

### Type Syntax

```urlspec
// String type
string

// String literal
"active"

// Union of literals
"small" | "medium" | "large"

// Type reference
sort_order  // References a param type
```

## Development

### Building

```bash
# Generate Langium parser and build
yarn build

# Just generate Langium artifacts
yarn langium:generate
```

### Testing

```bash
# Run tests
yarn test

# Watch mode
yarn test:watch
```

### Grammar Location

The Langium grammar is defined in:
```
packages/language/src/urlspec.langium
```

## Contributing

Contributions are welcome! Please see the [root repository README](../../README.md) for contribution guidelines.

### Common Tasks

**Modifying Grammar:**
1. Edit `src/urlspec.langium`
2. Run `yarn langium:generate`
3. Update TypeScript code as needed
4. Run tests: `yarn test`

**Adding Validation:**
1. Add validation logic in `src/validator.ts` (if exists)
2. Update tests
3. Update documentation

## Related Packages

- [@urlspec/builder](../builder) - Programmatic API to build URLSpec files
- [urlspec-vscode-extension](../urlspec-vscode-extension) - VS Code extension

## Resources

- [Langium Documentation](https://langium.org/docs/)
- [URLSpec Examples](../../examples/)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)

## License

MIT License - see [LICENSE](../../LICENSE) for details
