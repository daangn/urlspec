import { describe, expect, it } from "vitest";
import { parse, resolve } from "../src/index.js";

describe("URLSpec Resolver", () => {
  it("should resolve basic spec", async () => {
    const input = `
namespace "jobs";

endpoint alpha = "https://jobs.alpha.karrotwebview.com";

page list = /jobs {
  category?: string;
}
`;

    const doc = await parse(input);
    const spec = resolve(doc);

    expect(spec.namespace).toBe("jobs");
    expect(spec.endpoints).toHaveLength(1);
    expect(spec.endpoints[0]).toEqual({
      name: "alpha",
      url: "https://jobs.alpha.karrotwebview.com",
    });

    expect(spec.pages).toHaveLength(1);
    expect(spec.pages[0]?.name).toBe("list");
    expect(spec.pages[0]?.path).toBe("/jobs");
  });

  it("should resolve param types", async () => {
    const input = `
namespace "jobs";

param sort_order = "recent" | "popular" | "trending";

page list = /jobs {
  sort: sort_order;
}
`;

    const doc = await parse(input);
    const spec = resolve(doc);

    expect(spec.paramTypes).toHaveLength(1);
    expect(spec.paramTypes[0]?.name).toBe("sort_order");
    expect(spec.paramTypes[0]?.type).toEqual({
      kind: "union",
      values: ["recent", "popular", "trending"],
    });

    // Check that the type reference is resolved
    expect(spec.pages[0]?.parameters[0]?.type).toEqual({
      kind: "union",
      values: ["recent", "popular", "trending"],
    });
  });

  it("should merge global parameters", async () => {
    const input = `
namespace "jobs";

global {
  utm_source?: string;
  referrer?: string;
}

page list = /jobs {
  category?: string;
}
`;

    const doc = await parse(input);
    const spec = resolve(doc);

    expect(spec.global).toHaveLength(2);
    expect(spec.pages[0]?.parameters).toHaveLength(3);

    // Check global params
    expect(spec.pages[0]?.parameters[0]?.name).toBe("utm_source");
    expect(spec.pages[0]?.parameters[0]?.source).toBe("global");
    expect(spec.pages[0]?.parameters[1]?.name).toBe("referrer");
    expect(spec.pages[0]?.parameters[1]?.source).toBe("global");

    // Check page param
    expect(spec.pages[0]?.parameters[2]?.name).toBe("category");
    expect(spec.pages[0]?.parameters[2]?.source).toBe("page");
  });

  it("should resolve path segments", async () => {
    const input = `
namespace "jobs";

page detail = /jobs/:job_id/comments/:comment_id {
  job_id: string;
  comment_id: string;
}
`;

    const doc = await parse(input);
    const spec = resolve(doc);

    expect(spec.pages[0]?.path).toBe("/jobs/:job_id/comments/:comment_id");
    expect(spec.pages[0]?.pathSegments).toEqual([
      { type: "static", value: "jobs" },
      { type: "parameter", value: "job_id" },
      { type: "static", value: "comments" },
      { type: "parameter", value: "comment_id" },
    ]);
  });

  it("should resolve all types correctly", async () => {
    const input = `
namespace "jobs";

page test = /test {
  str: string;
  num: number;
  bool: boolean;
  literal: "exact";
  union: "a" | "b" | "c";
  optional?: string;
}
`;

    const doc = await parse(input);
    const spec = resolve(doc);

    const params = spec.pages[0]?.parameters;
    expect(params?.[0]?.type).toEqual({ kind: "primitive", value: "string" });
    expect(params?.[1]?.type).toEqual({ kind: "primitive", value: "number" });
    expect(params?.[2]?.type).toEqual({ kind: "primitive", value: "boolean" });
    expect(params?.[3]?.type).toEqual({ kind: "literal", value: "exact" });
    expect(params?.[4]?.type).toEqual({
      kind: "union",
      values: ["a", "b", "c"],
    });
    expect(params?.[5]?.optional).toBeTruthy();
  });

  it("should resolve complete example", async () => {
    const input = `
namespace "jobs";

endpoint alpha = "https://jobs.alpha.karrotwebview.com";
endpoint production = "https://jobs.karrotwebview.com";

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
`;

    const doc = await parse(input);
    const spec = resolve(doc);

    expect(spec.namespace).toBe("jobs");
    expect(spec.endpoints).toHaveLength(2);
    expect(spec.paramTypes).toHaveLength(2);
    expect(spec.global).toHaveLength(2);
    expect(spec.pages).toHaveLength(2);

    // Each page should have global + page params
    expect(spec.pages[0]?.parameters).toHaveLength(4); // 2 global + 2 page
    expect(spec.pages[1]?.parameters).toHaveLength(5); // 2 global + 3 page
  });
});
