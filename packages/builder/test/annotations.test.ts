import { parse, resolve } from "@urlspec/language";
import { describe, expect, it } from "vitest";
import { URLSpec } from "../src/index.js";

describe("URLSpec Builder annotations", () => {
  it("should print a string annotation above the page", () => {
    const spec = new URLSpec();

    spec.addPage({
      name: "detail",
      path: "/items/:itemId",
      parameters: [{ name: "itemId", type: "string" }],
      annotations: { minAppVersion: "24.30.0" },
    });

    expect(spec.toString()).toContain(
      '@minAppVersion = "24.30.0";\npage detail = /items/:itemId {',
    );
  });

  it("should print boolean and list annotations", () => {
    const spec = new URLSpec();

    spec.addPage({
      name: "list",
      path: "/items",
      annotations: {
        experimental: true,
        archived: false,
        owners: ["team-web", "team-search"],
      },
    });

    const result = spec.toString();

    expect(result).toContain("@experimental = true;");
    expect(result).toContain("@archived = false;");
    expect(result).toContain('@owners = ["team-web", "team-search"];');
  });

  it("should print an empty list annotation", () => {
    const spec = new URLSpec();

    spec.addPage({ name: "list", path: "/items", annotations: { owners: [] } });

    expect(spec.toString()).toContain("@owners = [];");
  });

  it("should keep the page comment above the annotations", () => {
    const spec = new URLSpec();

    spec.addPage({
      name: "detail",
      path: "/items",
      comment: "Item detail page",
      annotations: { minAppVersion: "24.30.0" },
    });

    expect(spec.toString()).toContain(
      '// Item detail page\n@minAppVersion = "24.30.0";\npage detail = /items {',
    );
  });

  it("should emit nothing for a page without annotations", () => {
    const spec = new URLSpec();

    spec.addPage({ name: "list", path: "/items" });

    expect(spec.toString()).not.toContain("@");
  });

  it("should annotate only the page it was given to", () => {
    const spec = new URLSpec();

    spec.addPage({
      name: "annotated",
      path: "/items",
      annotations: { minAppVersion: "24.30.0" },
    });
    spec.addPage({ name: "plain", path: "/about" });

    const result = spec.toString();

    expect(result.match(/@minAppVersion/g)).toHaveLength(1);
    expect(result).toContain("\npage plain = /about {");
  });

  it("should build output that parses back to the same annotations", async () => {
    const spec = new URLSpec();

    spec.addParamType("sortOrder", ["recent", "popular"]);
    spec.addGlobalParam({ name: "utm_source", type: "string", optional: true });
    spec.addPage({
      name: "list",
      path: "/items",
      parameters: [{ name: "sort", type: "sortOrder", optional: true }],
      annotations: {
        minAppVersion: "24.30.0",
        experimental: true,
        owners: ["team-web"],
      },
    });

    const parsed = resolve(await parse(spec.toString()));

    expect(parsed.pages[0]?.annotations).toEqual({
      minAppVersion: "24.30.0",
      experimental: true,
      owners: ["team-web"],
    });
  });

  it("should work alongside when clauses", async () => {
    const spec = new URLSpec();

    spec.addPage({
      name: "home",
      path: "/home",
      annotations: { minAppVersion: "24.30.0" },
      when: {
        discriminant: "pageType",
        variants: [
          { value: "feed", parameters: [{ name: "feedId", type: "string" }] },
          { value: "search", parameters: [{ name: "query", type: "string" }] },
        ],
      },
    });

    const parsed = resolve(await parse(spec.toString()));

    expect(parsed.pages[0]?.annotations).toEqual({ minAppVersion: "24.30.0" });
    expect(parsed.pages[0]?.variants?.variants).toHaveLength(2);
  });
});
