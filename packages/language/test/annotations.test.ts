import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse, parseFile, print, resolve } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixture(name: string): string {
  return join(__dirname, "fixtures", name);
}

/** parse() throws on the first error, so read diagnostics off the thrown doc. */
async function collectDiagnostics(source: string): Promise<string[]> {
  try {
    const doc = await parse(source);
    return (doc.diagnostics ?? []).map((d) => d.message);
  } catch (error) {
    return String((error as Error).message).split("\n");
  }
}

describe("URLSpec Annotations", () => {
  describe("parsing", () => {
    it("should parse a single string annotation", async () => {
      const doc = await parseFile(fixture("annotations-basic.urlspec"));
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const annotations = doc.parseResult.value.pages[0]?.annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations?.[0]?.key).toBe("@minAppVersion");
    });

    it("should parse every value kind on one page", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const annotations = doc.parseResult.value.pages[0]?.annotations ?? [];
      expect(annotations.map((a) => a.key)).toEqual([
        "@minAppVersion",
        "@movedTo",
        "@experimental",
        "@archived",
        "@owners",
      ]);
      expect(annotations.map((a) => a.value.$type)).toEqual([
        "AnnotationString",
        "AnnotationString",
        "AnnotationBoolean",
        "AnnotationBoolean",
        "AnnotationList",
      ]);
    });

    it("should parse empty, single, trailing-comma, and multi-line lists", async () => {
      const doc = await parseFile(fixture("annotations-list-variants.urlspec"));
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const spec = resolve(doc);
      expect(spec.pages[0]?.annotations).toEqual({
        empty: [],
        single: ["only"],
        trailingComma: ["first", "second"],
        multiline: ["alpha", "beta", "gamma"],
      });
    });

    it("should parse annotations on a root path page", async () => {
      const doc = await parseFile(fixture("annotations-root-path.urlspec"));
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const spec = resolve(doc);
      expect(spec.pages[0]?.path).toBe("/");
      expect(spec.pages[0]?.annotations).toEqual({ minAppVersion: "24.30.0" });
    });

    it("should parse annotations alongside when clauses", async () => {
      const doc = await parseFile(fixture("annotations-with-when.urlspec"));
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const spec = resolve(doc);
      expect(spec.pages[0]?.annotations).toEqual({
        minAppVersion: "24.30.0",
        owners: ["team-web"],
      });
      expect(spec.pages[0]?.variants?.variants).toHaveLength(2);
    });

    it("should parse annotations after param types and a global block", async () => {
      const doc = await parseFile(fixture("annotations-with-globals.urlspec"));
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const spec = resolve(doc);
      expect(spec.paramTypes).toHaveLength(1);
      expect(spec.global).toHaveLength(1);
      expect(spec.pages[0]?.annotations).toEqual({ minAppVersion: "24.30.0" });
    });

    it("should still allow true and false as parameter names", async () => {
      const doc = await parseFile(
        fixture("annotations-boolean-param-names.urlspec"),
      );
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);

      const spec = resolve(doc);
      expect(spec.pages[0]?.parameters.map((p) => p.name)).toEqual([
        "true",
        "false",
        "when",
      ]);
    });

    it("should reject an annotation that is not attached to a page", async () => {
      await expect(parse('@minAppVersion = "24.30.0";\n')).rejects.toThrow();
    });

    it("should reject an annotation with an unquoted string value", async () => {
      await expect(
        parse("@minAppVersion = 24.30.0;\npage a = /a {}\n"),
      ).rejects.toThrow();
    });

    it("should reject an annotation without a terminating semicolon", async () => {
      await expect(
        parse('@minAppVersion = "24.30.0"\npage a = /a {}\n'),
      ).rejects.toThrow();
    });
  });

  describe("the boundary URLSpec draws", () => {
    it("should accept any key it has never heard of", async () => {
      const doc = await parseFile(fixture("annotations-unknown-keys.urlspec"));

      // No key list exists to check against, by design. Whether these keys are
      // meaningful is the consumer's question, not the language's.
      expect(doc.diagnostics ?? []).toHaveLength(0);
      expect(resolve(doc).pages[0]?.annotations).toEqual({
        somethingUrlspecHasNeverHeardOf: "whatever",
        nonsense: ["a", "b"],
        x: true,
      });
    });

    it("should still reject anything about the shape of the line", async () => {
      const shapeErrors = [
        "@minAppVersion = 24.30.0;\npage a = /a {}\n", // unquoted value
        '@minAppVersion = "24.30.0"\npage a = /a {}\n', // no semicolon
        '@minAppVersion = ["a" "b"];\npage a = /a {}\n', // missing comma
        '@min_app_version = "24.30.0";\npage a = /a {}\n', // not camelCase
      ];

      for (const source of shapeErrors) {
        await expect(parse(source), source).rejects.toThrow();
      }
    });

    it("should not let a typo in a type hide behind the same leniency", async () => {
      // The annotation is unknown and fine; the parameter type is misspelled
      // and is not. Only one of the two is URLSpec's problem.
      await expect(
        parse('@unknownButFine = "x";\npage a = /a {\n  q: strng;\n}\n'),
      ).rejects.toThrow();
    });
  });

  describe("resolving", () => {
    it("should expose annotations as a record without the leading @", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      const spec = resolve(doc);

      expect(spec.pages[0]?.annotations).toEqual({
        minAppVersion: "24.30.0",
        movedTo: "/v2/items",
        experimental: true,
        archived: false,
        owners: ["team-web", "team-search"],
      });
    });

    it("should leave annotations undefined on pages that declare none", async () => {
      const doc = await parseFile(fixture("annotations-mixed-pages.urlspec"));
      const spec = resolve(doc);

      expect(spec.pages[0]?.annotations).toEqual({ minAppVersion: "24.30.0" });
      expect(spec.pages[1]?.annotations).toBeUndefined();
    });

    it("should not leak annotations into page parameters", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      const spec = resolve(doc);

      expect(spec.pages[0]?.parameters.map((p) => p.name)).toEqual(["itemId"]);
    });

    it("should keep the description when annotations follow the comment", async () => {
      const doc = await parseFile(
        fixture("annotations-with-description.urlspec"),
      );
      const spec = resolve(doc);

      expect(spec.pages[0]?.description).toBe("Item detail page");
    });

    it("should keep the description when annotations precede the comment", async () => {
      const doc = await parseFile(
        fixture("annotations-description-after.urlspec"),
      );
      const spec = resolve(doc);

      expect(spec.pages[0]?.description).toBe("Item detail page");
    });

    it("should keep multi-line descriptions", async () => {
      const doc = await parseFile(
        fixture("annotations-description-multiline.urlspec"),
      );
      const spec = resolve(doc);

      expect(spec.pages[0]?.description).toBe(
        "Item detail page\nOnly reachable from the feed",
      );
    });
  });

  describe("validation", () => {
    it("should accept camelCase annotation keys", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should reject snake_case annotation keys", async () => {
      await expect(
        parseFile(fixture("annotations-invalid-key-snake-case.urlspec")),
      ).rejects.toThrow("camelCase");
    });

    it("should reject PascalCase annotation keys", async () => {
      await expect(
        parseFile(fixture("annotations-invalid-key-pascal-case.urlspec")),
      ).rejects.toThrow("camelCase");
    });

    it("should reject the same annotation key twice on one page", async () => {
      await expect(
        parseFile(fixture("annotations-duplicate-key.urlspec")),
      ).rejects.toThrow("Duplicate annotation key");
    });

    it("should say so when an annotation is not followed by a page", async () => {
      await expect(parse("@deprecated = true;\n")).rejects.toThrow(
        "Annotations must be followed by a page declaration",
      );
    });

    it.each([
      [
        "param",
        '@deprecated = true;\nparam sortOrder = "recent";\npage a = /a {}\n',
      ],
      [
        "global",
        "@deprecated = true;\nglobal { utm?: string; }\npage a = /a {}\n",
      ],
      ["trailing", "page a = /a {}\n@deprecated = true;\n"],
    ])("should not crash the validator on an annotation before %s", async (_label, source) => {
      // The parser error-recovers into a page with no path; reaching through
      // it used to surface as "An error occurred during validation".
      await expect(parse(source)).rejects.toThrow();
      const diagnostics = await collectDiagnostics(source);
      expect(
        diagnostics.some((d) =>
          d.includes("An error occurred during validation"),
        ),
      ).toBe(false);
    });

    it("should allow the same annotation key on different pages", async () => {
      const doc = await parse(
        '@minAppVersion = "24.30.0";\npage a = /a {}\n@minAppVersion = "24.31.0";\npage b = /b {}\n',
      );
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("printing", () => {
    it("should print annotations above the page declaration", async () => {
      const doc = await parseFile(fixture("annotations-basic.urlspec"));
      const printed = print(doc);

      expect(printed).toContain('@minAppVersion = "24.30.0";\npage detail =');
    });

    it("should print every value kind", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      const printed = print(doc);

      expect(printed).toContain('@minAppVersion = "24.30.0";');
      expect(printed).toContain("@experimental = true;");
      expect(printed).toContain("@archived = false;");
      expect(printed).toContain('@owners = ["team-web", "team-search"];');
    });

    it("should keep a short list on one line", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      expect(print(doc)).toContain('@owners = ["team-web", "team-search"];\n');
    });

    it("should print an empty list", async () => {
      const doc = await parseFile(fixture("annotations-list-variants.urlspec"));
      expect(print(doc)).toContain("@empty = [];");
    });

    it("should break a long list across lines", async () => {
      const doc = await parseFile(fixture("annotations-long-list.urlspec"));
      const printed = print(doc);

      expect(printed).toContain(
        '@owners = [\n  "team-web",\n  "team-search",\n  "team-growth",\n  "team-mobile",\n  "team-infra",\n];',
      );
    });

    it("should print the description comment above the annotations", async () => {
      const doc = await parseFile(
        fixture("annotations-description-after.urlspec"),
      );
      const printed = print(doc);

      expect(printed).toContain(
        '// Item detail page\n@minAppVersion = "24.30.0";\npage detail =',
      );
    });

    it("should omit annotations for pages that declare none", async () => {
      const doc = await parseFile(fixture("annotations-mixed-pages.urlspec"));
      const printed = print(doc);

      expect(printed).toContain("\npage plain = /about {");
      expect(printed.match(/@minAppVersion/g)).toHaveLength(1);
    });

    it("should roundtrip through print and parse", async () => {
      for (const name of [
        "annotations-basic.urlspec",
        "annotations-multiple.urlspec",
        "annotations-list-variants.urlspec",
        "annotations-with-when.urlspec",
        "annotations-with-globals.urlspec",
        "annotations-root-path.urlspec",
        "annotations-long-list.urlspec",
      ]) {
        const first = print(await parseFile(fixture(name)));
        const second = print(await parse(first));
        expect(second, name).toBe(first);
      }
    });

    it("should preserve resolved annotations through a roundtrip", async () => {
      const doc = await parseFile(fixture("annotations-multiple.urlspec"));
      const before = resolve(doc).pages[0]?.annotations;
      const after = resolve(await parse(print(doc))).pages[0]?.annotations;

      expect(after).toEqual(before);
    });
  });
});
