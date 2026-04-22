---
"@urlspec/builder": minor
"@urlspec/language": minor
---

feat: support description comments on when clauses

- `@urlspec/language`: `ResolvedVariant` now exposes `description`, extracted
  from SL_COMMENT lines immediately preceding the `when` clause.
- `@urlspec/builder`: `VariantDefinition` gains a `comment?: string` field
  that is emitted as `// ...` lines above the corresponding `when` clause.
