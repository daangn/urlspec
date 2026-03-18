import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFile } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec Validation", () => {
  describe("Parameter key naming validation", () => {
    it("should accept parameter keys in snake_case", async () => {
      const doc = await parseFile(
        fixture("validation-param-snake-case.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys in camelCase", async () => {
      const doc = await parseFile(
        fixture("validation-param-camelCase-invalid.urlspec"),
      );

      // Parameter naming restriction has been removed
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys in PascalCase", async () => {
      const doc = await parseFile(
        fixture("validation-param-PascalCase-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys with mixed case", async () => {
      const doc = await parseFile(
        fixture("validation-param-mixed-case-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept parameter keys starting with uppercase", async () => {
      const doc = await parseFile(
        fixture("validation-param-uppercase-start-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept global parameter keys in snake_case", async () => {
      const doc = await parseFile(
        fixture("validation-global-snake-case.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept global parameter keys in camelCase", async () => {
      const doc = await parseFile(
        fixture("validation-global-camelCase-invalid.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("Page name validation", () => {
    it("should accept page names with dots and underscores", async () => {
      const doc = await parseFile(
        fixture("validation-page-name-dot-underscore.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("ParamType alias naming validation", () => {
    it("should accept ParamType names in camelCase", async () => {
      const doc = await parseFile(
        fixture("validation-paramtype-camelCase.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("Path parameter validation", () => {
    it("should require path parameters to be declared in parameter block", async () => {
      await expect(
        parseFile(fixture("validation-path-param-missing.urlspec")),
      ).rejects.toThrow("job_id");
    });

    it("should accept path parameters when declared in parameter block", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-declared.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should require all path parameters to be declared", async () => {
      await expect(
        parseFile(fixture("validation-path-param-multiple-missing.urlspec")),
      ).rejects.toThrow("comment_id");
    });

    it("should accept multiple path parameters when all are declared", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-multiple-declared.urlspec"),
      );

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should accept path parameter in any naming convention", async () => {
      const doc = await parseFile(
        fixture("validation-path-param-camelCase-invalid.urlspec"),
      );

      // Parameter naming restriction has been removed
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("When clause validation", () => {
    it("should accept valid when clauses with single discriminant", async () => {
      const doc = await parseFile(fixture("when-clauses.urlspec"));

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should reject multiple discriminants in when clauses", async () => {
      await expect(
        parseFile(fixture("when-clauses-multiple-discriminants.urlspec")),
      ).rejects.toThrow("discriminant");
    });

    it("should reject duplicate when clause values", async () => {
      await expect(
        parseFile(fixture("when-clauses-duplicate-value.urlspec")),
      ).rejects.toThrow("Duplicate");
    });

    it("should reject discriminant declared in parameter block", async () => {
      await expect(
        parseFile(fixture("when-clauses-discriminant-in-params.urlspec")),
      ).rejects.toThrow("type");
    });
  });

  describe("Combined validation scenarios", () => {
    it("should validate path parameter declaration", async () => {
      await expect(
        parseFile(fixture("validation-combined-invalid.urlspec")),
      ).rejects.toThrow("URLSpec validation failed");
    });

    it("should accept valid specification with all rules followed", async () => {
      const doc = await parseFile(fixture("validation-combined-valid.urlspec"));

      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });
});
