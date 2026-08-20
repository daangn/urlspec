---
"@urlspec/language": minor
"@urlspec/builder": minor
"urlspec-vscode-extension": minor
---

Add page annotations (`@key = value;`)

Annotations attach facts to a page that URLSpec itself does not interpret:

```urlspec
@minAppVersion = "24.30.0";
@owners = ["team-web", "team-search"];
page detail = /items/:itemId {
  itemId: string;
}
```

Values may be a string, `true`/`false`, or a list of strings. URLSpec validates
the shape — camelCase keys, no duplicate key on one page — and leaves the
meaning of each key to whatever consumes the spec.

`ResolvedPage` gains an `annotations` record (absent when a page declares none),
the printer emits annotations above the declaration, and `URLSpec.addPage()`
accepts an `annotations` option.
