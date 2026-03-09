import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse, parseFile, print } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

describe("URLSpec Printer", () => {
  it("should print and parse roundtrip", async () => {
    const doc1 = await parseFile(fixture("complete-example.urlspec"));
    const printed = print(doc1);

    // Parse again
    const doc2 = await parseFile(fixture("complete-example.urlspec"));

    // Should have no errors
    expect(doc2.parseResult.lexerErrors).toHaveLength(0);
    expect(doc2.parseResult.parserErrors).toHaveLength(0);

    // Print doc1 and doc2 - should be identical
    const printed2 = print(doc2);
    expect(printed2).toBe(printed);
  });

  it("should print basic spec", async () => {
    const doc = await parseFile(fixture("printer-basic.urlspec"));
    const printed = print(doc);

    expect(printed).not.toContain("namespace");
    expect(printed).toContain("page home = /home {");
    expect(printed).toContain("query?: string;");
  });

  it("should print path parameters", async () => {
    const doc = await parseFile(fixture("printer-path-params.urlspec"));
    const printed = print(doc);

    expect(printed).toContain("/items/:item_id");
  });

  it("should preserve descriptions as comments", async () => {
    const doc = await parseFile(fixture("with-descriptions.urlspec"));
    const printed = print(doc);

    // Param type description
    expect(printed).toContain("// Sort order for job listings");
    expect(printed).toContain("// Used to determine how jobs are displayed");

    // Global param descriptions
    expect(printed).toContain("  // Referrer source");
    expect(printed).toContain("  // Indicates where the user came from");
    expect(printed).toContain("  // UTM source parameter");

    // Page descriptions
    expect(printed).toContain("// Job listings page");
    expect(printed).toContain("// Displays a list of all available jobs");
    expect(printed).toContain("// Job detail page");

    // Parameter descriptions
    expect(printed).toContain("  // Job category filter");
    expect(printed).toContain("  // Sort order");
    expect(printed).toContain("  // Unique job identifier");
    expect(printed).toContain("  // Preview mode flag");
  });

  it("should roundtrip descriptions through print-parse-print", async () => {
    const doc1 = await parseFile(fixture("with-descriptions.urlspec"));
    const printed1 = print(doc1);

    // Re-parse the printed output
    const doc2 = await parse(printed1);
    expect(doc2.parseResult.lexerErrors).toHaveLength(0);
    expect(doc2.parseResult.parserErrors).toHaveLength(0);

    // Re-print should produce the same output
    const printed2 = print(doc2);
    expect(printed2).toBe(printed1);
  });
});
