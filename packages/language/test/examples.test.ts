import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse, parseFile, print, resolve } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examplesDir = join(__dirname, "..", "..", "..", "examples");
const examples = readdirSync(examplesDir).filter((f) => f.endsWith(".urlspec"));

describe("examples/", () => {
  it("should ship at least one example", () => {
    expect(examples.length).toBeGreaterThan(0);
  });

  it.each(examples)("%s should parse, resolve, and roundtrip", async (name) => {
    const doc = await parseFile(join(examplesDir, name));
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);
    expect(doc.diagnostics ?? []).toHaveLength(0);

    expect(resolve(doc).pages.length).toBeGreaterThan(0);

    const printed = print(doc);
    expect(print(await parse(printed))).toBe(printed);
  });

  it("annotations.urlspec should demonstrate every value kind", async () => {
    const spec = resolve(
      await parseFile(join(examplesDir, "annotations.urlspec")),
    );
    const values = spec.pages.flatMap((p) =>
      Object.values(p.annotations ?? {}),
    );

    expect(values.some((v) => typeof v === "string")).toBe(true);
    expect(values.some((v) => typeof v === "boolean")).toBe(true);
    expect(values.some((v) => Array.isArray(v))).toBe(true);
    expect(spec.pages.some((p) => p.annotations === undefined)).toBe(true);
  });
});
