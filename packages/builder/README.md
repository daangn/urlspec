# @urlspec/builder

> Programmatic API for building URLSpec files

[![npm version](https://img.shields.io/npm/v/@urlspec/builder.svg)](https://www.npmjs.com/package/@urlspec/builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

`@urlspec/builder` provides a fluent, programmatic API for generating `.urlspec` files in TypeScript. Instead of writing URLSpec syntax manually, you can build URLSpec documents using a chainable API, making it ideal for code generation tools, dynamic specification generation, and migration scripts.

## Features

- **Fluent API**: Chain method calls for readable code
- **Type-Safe**: Full TypeScript support with type checking
- **AST Generation**: Built on top of `@urlspec/language`
- **File Output**: Write directly to `.urlspec` files
- **Dynamic Generation**: Generate specifications programmatically (e.g., from loops, API schemas)

## Installation

```bash
# npm
npm install @urlspec/builder

# yarn
yarn add @urlspec/builder

# pnpm
pnpm add @urlspec/builder
```

## Quick Start

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();

spec.setNamespace('jobs');

spec.addParamType('sort_order', ['recent', 'popular', 'trending']);
spec.addParamType('job_status', ['active', 'closed', 'draft']);

spec.addGlobalParam({
  name: 'utm_source',
  type: 'string',
  optional: true,
});

spec.addPage({
  name: 'list',
  path: '/jobs',
  parameters: [
    { name: 'category', type: 'string', optional: true },
    { name: 'sort', type: 'sort_order' },
  ],
});

spec.addPage({
  name: 'detail',
  path: '/jobs/:job_id',
  parameters: [
    { name: 'job_id', type: 'string' },
    { name: 'preview', type: ['true', 'false'], optional: true },
    { name: 'status', type: 'job_status', optional: true },
  ],
});

// Output to string
console.log(spec.toString());

// Write to file
await spec.writeFile('./jobs.urlspec');
```

**Output:**

```urlspec
namespace "jobs";

param sort_order = "recent" | "popular" | "trending";
param job_status = "active" | "closed" | "draft";

global {
  utm_source?: string;
}

page list = /jobs {
  category?: string;
  sort: sort_order;
}

page detail = /jobs/:job_id {
  job_id: string;
  preview?: "true" | "false";
  status?: job_status;
}
```

## API Reference

### `URLSpec`

Main builder class for constructing URLSpec documents.

#### Constructor

```typescript
const spec = new URLSpec();
```

#### Methods

##### `setNamespace(name: string): void`

Set the namespace for the URLSpec document (required).

```typescript
spec.setNamespace('api.v1');
```


##### `addParamType(name: string, type: ParamType): void`

Add a reusable parameter type definition.

```typescript
// Primitive type
spec.addParamType('status', 'string');

// String literal
spec.addParamType('role', 'admin');

// Union of string literals
spec.addParamType('sort', ['asc', 'desc']);
spec.addParamType('priority', ['low', 'medium', 'high']);

// Reference to another param type (define that type first)
spec.addParamType('user_sort', 'sort');
```

**`ParamType` Definition:**
```typescript
type ParamType = 'string' | string | string[];
```

##### `addGlobalParam(param: ParameterDefinition): void`

Add a global parameter that applies to all pages.

```typescript
spec.addGlobalParam({
  name: 'utm_source',
  type: 'string',
  optional: true,
});

spec.addGlobalParam({
  name: 'debug',
  type: ['true', 'false'],
  optional: true,
});
```

##### `addPage(page: PageDefinition): void`

Add a page definition.

```typescript
spec.addPage({
  name: 'user_profile',
  path: '/users/:user_id',
  parameters: [
    { name: 'user_id', type: 'string' },
    { name: 'tab', type: ['posts', 'likes', 'comments'], optional: true },
  ],
});
```

**`PageDefinition` Interface:**
```typescript
interface PageDefinition {
  name: string;
  path: string;
  parameters?: ParameterDefinition[];
  comment?: string; // Not yet implemented
}
```

**`ParameterDefinition` Interface:**
```typescript
interface ParameterDefinition {
  name: string;
  type: ParamType;
  optional?: boolean;
}
```

##### `toAST(): URLSpecDocument`

Build and return the Langium AST document.

```typescript
const ast = spec.toAST();
console.log(ast.namespace);
console.log(ast.pages);
```

##### `toString(): string`

Convert the spec to formatted `.urlspec` text.

```typescript
const urlspecText = spec.toString();
console.log(urlspecText);
```

##### `writeFile(path: string): Promise<void>`

Write the spec to a file.

```typescript
await spec.writeFile('./output/api.urlspec');
```

## Usage Examples

### Basic Example

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();

spec.setNamespace('blog');

spec.addPage({
  name: 'home',
  path: '/',
});

spec.addPage({
  name: 'article',
  path: '/articles/:article_id',
  parameters: [
    { name: 'article_id', type: 'string' },
  ],
});

console.log(spec.toString());
```

### Dynamic Page Generation

Generate multiple similar pages programmatically:

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();
spec.setNamespace('jobs');

// Define available statuses
const statuses = ['pending', 'approved', 'rejected', 'archived'];

// Generate a page for each status
for (const status of statuses) {
  spec.addPage({
    name: `${status}_jobs`,
    path: `/jobs/${status}`,
    parameters: [
      { name: 'page', type: 'string', optional: true },
      { name: 'limit', type: 'string', optional: true },
    ],
  });
}

await spec.writeFile('./jobs.urlspec');
```

### Type Reference Example

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();
spec.setNamespace('shop');

// Define reusable types
spec.addParamType('category', ['electronics', 'clothing', 'food', 'books']);
spec.addParamType('sort_by', ['price', 'popularity', 'newest']);
spec.addParamType('sort_order', ['asc', 'desc']);

// Use type references in pages
spec.addPage({
  name: 'products',
  path: '/products',
  parameters: [
    { name: 'cat', type: 'category', optional: true },
    { name: 'sort', type: 'sort_by', optional: true },
    { name: 'order', type: 'sort_order', optional: true },
  ],
});

spec.addPage({
  name: 'search',
  path: '/search',
  parameters: [
    { name: 'q', type: 'string' },
    { name: 'category', type: 'category', optional: true },
  ],
});

console.log(spec.toString());
```

### Global Parameters Example

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();
spec.setNamespace('analytics');

// Add global tracking parameters
spec.addGlobalParam({
  name: 'utm_source',
  type: 'string',
  optional: true,
});

spec.addGlobalParam({
  name: 'utm_campaign',
  type: 'string',
  optional: true,
});

spec.addGlobalParam({
  name: 'utm_medium',
  type: ['email', 'social', 'cpc', 'banner'],
  optional: true,
});

// These pages will inherit global parameters
spec.addPage({
  name: 'landing',
  path: '/landing',
});

spec.addPage({
  name: 'signup',
  path: '/signup',
  parameters: [
    { name: 'plan', type: ['free', 'pro', 'enterprise'] },
  ],
});

await spec.writeFile('./analytics.urlspec');
```

### Converting from OpenAPI/Swagger

```typescript
import { URLSpec } from '@urlspec/builder';

// Hypothetical OpenAPI schema
const openAPISchema = {
  basePath: 'https://api.example.com',
  paths: {
    '/users': {
      get: {
        parameters: [
          { name: 'page', type: 'integer' },
          { name: 'limit', type: 'integer' },
        ],
      },
    },
    '/users/{userId}': {
      get: {
        parameters: [
          { name: 'userId', in: 'path', type: 'string' },
        ],
      },
    },
  },
};

// Convert to URLSpec
const spec = new URLSpec();
spec.setNamespace('api');

for (const [path, methods] of Object.entries(openAPISchema.paths)) {
  const getMethod = methods.get;
  if (getMethod) {
    const name = path.replace(/\//g, '_').replace(/[{}]/g, '');
    const urlspecPath = path.replace(/{(\w+)}/g, ':$1');

    spec.addPage({
      name,
      path: urlspecPath,
      parameters: getMethod.parameters.map(p => ({
        name: p.name,
        type: 'string', // All types are string in URLSpec
        optional: p.in !== 'path',
      })),
    });
  }
}

console.log(spec.toString());
```

### Migration from Legacy URL Definitions

```typescript
import { URLSpec } from '@urlspec/builder';

// Legacy route definitions
const legacyRoutes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'product', path: '/products/:id', params: ['id'] },
];

// Convert to URLSpec
const spec = new URLSpec();
spec.setNamespace('website');

for (const route of legacyRoutes) {
  spec.addPage({
    name: route.name,
    path: route.path,
    parameters: route.params?.map(param => ({
      name: param,
      type: 'string',
    })),
  });
}

await spec.writeFile('./website.urlspec');
```

## Advanced Usage

### Working with AST

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();
spec.setNamespace('api');
spec.addPage({ name: 'home', path: '/' });

// Get the AST
const ast = spec.toAST();

// Access AST properties
console.log(ast.$type); // "URLSpecModel"
console.log(ast.namespace); // { value: "api" }
console.log(ast.pages.length); // 1

// Use with @urlspec/language functions
import { print } from '@urlspec/language';

const doc = {
  parseResult: { value: ast },
} as any;

console.log(print(doc));
```

### Low-Level AST Creation

For advanced use cases, you can use the exported AST builder functions directly:

```typescript
import {
  createURLSpecDocument,
  createPageDeclaration,
  createParameterDeclaration,
  createStringType,
  createStringLiteralType,
  createUnionType,
} from '@urlspec/builder';

const ast = createURLSpecDocument({
  namespace: 'api',
  pages: [
    createPageDeclaration(
      'users',
      '/users',
      [
        createParameterDeclaration('sort', createStringLiteralType('name'), true),
      ]
    ),
  ],
});
```

## Type Exports

The package exports all necessary TypeScript types:

```typescript
import type {
  URLSpec,
  ParamType,
  ParameterDefinition,
  PageDefinition,
  // Langium AST types
  URLSpecDocument,
  PageDeclaration,
  ParameterDeclaration,
  Type,
  // ... and more
} from '@urlspec/builder';
```

## Error Handling

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();

try {
  // This will throw an error because namespace is required
  const ast = spec.toAST();
} catch (error) {
  console.error(error.message); // "Namespace is required"
}

// Set namespace to fix
spec.setNamespace('api');
const ast = spec.toAST(); // Works now
```

## Use Cases

### 1. Code Generation Tools

Generate URLSpec files from database schemas, GraphQL schemas, or API documentation.

### 2. Testing

Programmatically create URLSpec documents for testing parsers and validators.

### 3. Migration Scripts

Convert legacy routing configurations to URLSpec format.

### 4. Dynamic Specifications

Generate specs based on runtime configuration or environment variables.

### 5. API Documentation

Automatically generate URLSpec files from your API implementation.

## Development

### Building

```bash
yarn build
```

### Testing

```bash
# Run tests
yarn test

# Watch mode
yarn test:watch
```

## Related Packages

- [@urlspec/language](../language) - Core language implementation (used internally)
- [urlspec-vscode-extension](../urlspec-vscode-extension) - VS Code extension

## Contributing

Contributions are welcome! Please see the [root repository README](../../README.md) for contribution guidelines.

## Resources

- [URLSpec Language Specification](../language/README.md)
- [Examples](../../examples/)
- [Langium Documentation](https://langium.org/)

## License

MIT License - see [LICENSE](../../LICENSE) for details
