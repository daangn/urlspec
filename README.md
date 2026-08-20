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
param sortOrder = "recent" | "popular" | "trending";
param jobStatus = "active" | "closed" | "draft";

global {
  referrer?: "jobs" | "hello";
  utm_source?: string;
}

page list = /jobs {
  category?: string;
  sort: sortOrder;
}

page detail = /jobs/:job_id {
  job_id: string;
  preview?: "true" | "false";
  status?: jobStatus;
}
```

### 2. Use in Your Code

```typescript
import { parse, resolve } from '@urlspec/language';

const doc = await parse(urlspecContent);
const spec = resolve(doc);

// Access resolved structure
console.log(spec.pages[0].path); // "/jobs"
console.log(spec.pages[0].parameters[0].type); // { kind: 'union', values: ['recent', 'popular', 'trending'] }
```

### 3. Build Programmatically

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();
spec.addParamType('sortOrder', ['recent', 'popular', 'trending']);
spec.addPage({
  name: 'list',
  path: '/jobs',
  parameters: [
    { name: 'category', type: 'string', optional: true },
    { name: 'sort', type: 'sortOrder' },
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

URLSpec supports a type system for query parameters:

- **String Type**: `string`
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

### Annotations

Annotations record facts *about* a page, written above its declaration:

```urlspec
// Item detail page
@minAppVersion = "24.30.0";
@owners = ["team-web", "team-search"];
page detail = /items/:itemId {
  itemId: string;
  status?: itemStatus;
}
```

#### Why they exist

A `.urlspec` file is the one place where a team already writes down every URL
its service owns. That makes it the natural place to also write down what is
true *of* those URLs — the minimum app version a scheme works from, the team on
call for a page, where a retired page moved to.

None of those facts are URL structure, and URLSpec has no opinion about them.
Growing the core language a keyword at a time for each new fact would make
URLSpec the union of every consumer's needs. Annotations are the alternative: a
single, stable extension point. **URLSpec checks the shape of the line and
nothing else.** Which keys are legal, and what their values mean, belongs to
whatever reads the spec — a schema on your own server, a code generator, a
linter.

#### Where the boundary falls

The `@` marks the point past which URLSpec stops knowing, so the two kinds of
mistake fail in two visibly different places:

```urlspec
itemId: strng;                  // parse error — offline, immediately
@minAppVerson = "24.30.0";      // parses fine; your consumer rejects the key
```

That split is the whole point. A misspelled type is the language's problem and
is caught with no network and no configuration. A misspelled annotation key is
your schema's problem, and only your schema can catch it — so URLSpec does not
pretend to.

#### Values

A value is a string, a boolean, or a list of strings:

```urlspec
@minAppVersion = "24.30.0";
@deprecated = true;
@owners = ["team-web", "team-search"];
```

Lists may break across lines and may carry a trailing comma:

```urlspec
@owners = [
  "team-web",
  "team-search",
];
```

Lists are bracketed rather than bare (`"a", "b"`) so that how many values an
annotation holds is readable from the syntax alone. A parser must never need
your schema in hand to know where a value ends.

There is deliberately no syntax for multi-line strings. Long prose belongs to
the system that displays it, not to a file that ships with your code; if the
need turns out to be real, a triple-quoted form is free to add later — it is a
parse error today, so no existing file can break.

#### What URLSpec enforces

Two rules, both decidable without knowing what a key means:

- Keys are camelCase, so annotations read like the rest of the file.
- A key may not appear twice on one page — the second would silently win, and
  there is no sensible merge for a key the language cannot interpret.

Everything else is your consumer's call.

#### Why above the declaration, and why `@`

Annotations sit outside the braces so that the parameter block keeps meaning
exactly one thing: the query parameters this URL accepts. Mixed in, every future
reader would have to sort two kinds of line apart by eye.

`@` is the mark that decorators, `@media`, `@Override`, and JSDoc tags all
already use for the same idea — metadata on a declaration, processed by
something outside the language proper. It is also one of the few punctuation
marks that carries no meaning inside a URL, which matters in a file full of
them: `#` is a fragment (and a comment character in half the config languages in
use), `%` is percent-encoding, `?` and `&` are the query string.

#### Reading annotations

`resolve()` returns them as a plain record, with the `@` dropped. Pages that
declare none have no `annotations` property at all:

```typescript
import { parse, resolve } from '@urlspec/language';

const spec = resolve(await parse(source));

spec.pages[0].annotations;
// { minAppVersion: '24.30.0', owners: ['team-web', 'team-search'] }
```

#### Writing annotations

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();
spec.addPage({
  name: 'detail',
  path: '/items/:itemId',
  parameters: [{ name: 'itemId', type: 'string' }],
  annotations: {
    minAppVersion: '24.30.0',
    owners: ['team-web', 'team-search'],
  },
});
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
