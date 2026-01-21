# URLSpec

> A type-safe, declarative language for defining and documenting URL structures in web applications.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

URLSpec is a domain-specific language (DSL) that brings type safety and clarity to URL definitions. Instead of scattering URL structures across your codebase, URLSpec provides a single source of truth for your application's URL architecture.

### Why URLSpec?

**The Problem**: URLs in web applications are typically defined as magic strings scattered throughout the codebase. This leads to:
- Runtime errors from typos or incorrect parameter types
- Difficulty in understanding the complete URL structure of an application
- No type checking for query parameters or path segments
- Hard-to-refactor URL changes across large codebases

**The Solution**: URLSpec provides a declarative syntax to define your URLs with:
- **Type Safety**: Catch URL-related errors at development time
- **Documentation**: Self-documenting URL structures
- **IDE Support**: Syntax highlighting, validation, and auto-completion
- **Code Generation**: Generate type-safe URL builders for your application
- **Refactorability**: Change URLs with confidence

## Quick Start

### 1. Define Your URLs

Create a `.urlspec` file:

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

### 2. Use in Your Code

```typescript
import { resolve } from '@urlspec/language';

const spec = resolve(urlspecContent);

// Access resolved structure
console.log(spec.namespace); // "jobs"
console.log(spec.pages.list.path); // "/jobs"
console.log(spec.pages.list.parameters.sort.type); // ["recent", "popular", "trending"]
```

### 3. Build Programmatically

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec()
  .setNamespace('jobs')
  .addEndpoint('production', 'https://jobs.example.com')
  .addParamType('sort_order', {
    kind: 'union',
    types: [
      { kind: 'literal', value: 'recent' },
      { kind: 'literal', value: 'popular' },
    ],
  })
  .addPage({
    name: 'list',
    path: '/jobs',
    parameters: [
      {
        name: 'sort',
        optional: false,
        type: { kind: 'reference', name: 'sort_order' },
      },
    ],
  });

console.log(spec.toString());
```

## Monorepo Structure

This repository is organized as a monorepo containing three main packages:

### Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@urlspec/language](./packages/language) | Core language implementation, parser, and resolver | ![npm](https://img.shields.io/npm/v/@urlspec/language) |
| [@urlspec/builder](./packages/builder) | Programmatic API for building URLSpec files | ![npm](https://img.shields.io/npm/v/@urlspec/builder) |
| [urlspec-vscode-extension](./packages/urlspec-vscode-extension) | VS Code extension with syntax highlighting and validation | - |

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Your Application                   │
└──────────────┬─────────────────────┬─────────────────┘
               │                     │
               │                     │
        ┌──────▼──────┐       ┌──────▼──────┐
        │  @urlspec/  │       │  @urlspec/  │
        │   language  │◄──────│   builder   │
        │             │       │             │
        │  (Parser &  │       │  (Builder   │
        │  Resolver)  │       │     API)    │
        └──────▲──────┘       └─────────────┘
               │
               │
        ┌──────▼──────────────────┐
        │  urlspec-vscode-        │
        │     extension           │
        │                         │
        │  (IDE Integration)      │
        └─────────────────────────┘
```

## Language Features

### Type System

URLSpec supports a rich type system for query parameters:

- **Primitives**: `string`
- **String Literals**: `"active"`, `"closed"`
- **Union Types**: `"recent" | "popular" | "trending"`
- **Type Aliases**: Define reusable types with `param`

### Path Syntax

Define paths with static and dynamic segments:

```urlspec
page static = /jobs/list                        // Static path
page dynamic = /jobs/:job_id                    // Single param
page nested = /articles/:article_id/comments/:comment_id  // Multiple params
```

### Global Parameters

Define query parameters that apply to all pages:

```urlspec
global {
  utm_source?: string;
  utm_campaign?: string;
  referrer?: string;
}
```

## Development

### Prerequisites

- Node.js 24+
- Yarn 4.12.0+

### Setup

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Format code
yarn format
```

### Project Scripts

- `yarn build` - Build all packages in dependency order
- `yarn format` - Check and fix code formatting with Biome

### Package Development

Each package has its own development scripts:

```bash
# Language package
cd packages/language
yarn test              # Run tests
yarn test:watch        # Watch mode
yarn langium:generate  # Generate parser from grammar

# Builder package
cd packages/builder
yarn test              # Run tests
yarn test:watch        # Watch mode

# VS Code Extension
cd packages/urlspec-vscode-extension
yarn watch             # Watch mode for development
yarn build             # Build and package extension
```
