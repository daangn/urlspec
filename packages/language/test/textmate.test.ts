import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * The VS Code extension's TextMate grammar is hand-maintained, so nothing
 * regenerates it when the Langium grammar changes. These tests check the
 * patterns directly — no editor, no oniguruma — so the two cannot drift apart
 * silently.
 */
const grammars = {
  "vscode-extension": join(
    __dirname,
    "../../urlspec-vscode-extension/syntaxes/urlspec.tmLanguage.json",
  ),
  generated: join(__dirname, "../syntaxes/urlspec.tmLanguage.json"),
};

function load(path: string) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function findPattern(grammar: any, name: string): string {
  const inline = grammar.patterns.find((p: any) => p.name === name)?.match;
  if (inline) return inline;

  const repo = Object.values(grammar.repository ?? {}).find(
    (p: any) => p.name === name,
  ) as { match?: string } | undefined;
  if (!repo?.match) throw new Error(`no pattern named ${name}`);
  return repo.match;
}

describe("TextMate grammar", () => {
  describe.each(Object.entries(grammars))("%s", (_label, path) => {
    it("should be valid JSON for the urlspec scope", () => {
      const grammar = load(path);
      expect(grammar.scopeName).toBe("source.urlspec");
      expect(grammar.fileTypes).toContain(".urlspec");
    });

    it("should highlight every language keyword", () => {
      const keywords = findPattern(load(path), "keyword.control.urlspec");
      for (const keyword of ["page", "param", "global", "string", "when"]) {
        expect(new RegExp(keywords).test(keyword), keyword).toBe(true);
      }
    });

    it("should highlight boolean literals", () => {
      const grammar = load(path);
      // Booleans may be scoped as a constant or folded into the keyword rule.
      const patterns = [
        ...grammar.patterns.map((p: any) => p.match),
        ...Object.values(grammar.repository ?? {}).map((p: any) => p.match),
      ].filter(Boolean) as string[];

      for (const literal of ["true", "false"]) {
        expect(
          patterns.some((p) => new RegExp(p).test(literal)),
          literal,
        ).toBe(true);
      }
    });
  });

  describe("annotation keys", () => {
    // Resolved per test rather than once at collection time, so a missing
    // pattern fails as an assertion instead of a collection error.
    function annotationPattern(): RegExp {
      return new RegExp(
        findPattern(
          load(grammars["vscode-extension"]),
          "entity.other.attribute-name.urlspec",
        ),
      );
    }

    it("should define an annotation pattern", () => {
      expect(() => annotationPattern()).not.toThrow();
    });

    it.each([
      "@minAppVersion",
      "@owners",
      "@movedTo",
      "@a",
    ])("should match %s", (key) => {
      expect(annotationPattern().test(key)).toBe(true);
    });

    it.each([
      "@",
      "@1version",
      "minAppVersion",
    ])("should not match %s", (text) => {
      const match = text.match(annotationPattern());
      expect(match?.[0]).not.toBe(text);
    });

    it("should match the key but not the value in a full annotation line", () => {
      const line = '@minAppVersion = "24.30.0";';
      expect(line.match(annotationPattern())?.[0]).toBe("@minAppVersion");
    });
  });
});
