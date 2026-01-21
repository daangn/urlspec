import { describe, expect, it } from "vitest";
import { parse } from "../src/index.js";

describe("URLSpec Parser", () => {
  it("should parse basic namespace", async () => {
    const input = `
namespace "jobs";
`;

    const doc = await parse(input);
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.namespace.name).toBe("jobs");
  });

  it("should parse endpoints", async () => {
    const input = `
namespace "jobs";

endpoint alpha = "https://jobs.alpha.karrotwebview.com";
endpoint production = "https://jobs.karrotwebview.com";
`;

    const doc = await parse(input);
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.endpoints).toHaveLength(2);
    expect(model.endpoints[0]?.name).toBe("alpha");
    expect(model.endpoints[1]?.name).toBe("production");
  });

  it("should parse param types", async () => {
    const input = `
namespace "jobs";

param sort_order = "recent" | "popular" | "trending";
param job_status = "active" | "closed" | "draft";
`;

    const doc = await parse(input);
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.paramTypes).toHaveLength(2);
    expect(model.paramTypes[0]?.name).toBe("sort_order");
    expect(model.paramTypes[1]?.name).toBe("job_status");
  });

  it("should parse global block", async () => {
    const input = `
namespace "jobs";

global {
  referrer?: string;
  utm_source?: string;
}
`;

    const doc = await parse(input);
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.global).toBeDefined();
    expect(model.global?.parameters).toHaveLength(2);
  });

  it("should parse page declarations", async () => {
    const input = `
namespace "jobs";

param sort_order = "recent" | "popular" | "trending";

page list = /jobs {
  category?: string;
  sort: sort_order;
}

page detail = /jobs/:job_id {
  job_id: string;
  preview?: boolean;
}
`;

    const doc = await parse(input);
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.pages).toHaveLength(2);
    expect(model.pages[0]?.name).toBe("list");
    expect(model.pages[1]?.name).toBe("detail");

    // Check path segments
    const listPath = model.pages[0]?.path;
    expect(listPath?.segments).toHaveLength(1);
    expect(listPath?.segments[0]?.static).toBe("jobs");

    const detailPath = model.pages[1]?.path;
    expect(detailPath?.segments).toHaveLength(2);
    expect(detailPath?.segments[0]?.static).toBe("jobs");
    expect(detailPath?.segments[1]?.parameter).toBe("job_id");
  });

  it("should parse complete example", async () => {
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
    expect(doc.parseResult.lexerErrors).toHaveLength(0);
    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const model = doc.parseResult.value;
    expect(model.namespace.name).toBe("jobs");
    expect(model.endpoints).toHaveLength(2);
    expect(model.paramTypes).toHaveLength(2);
    expect(model.global).toBeDefined();
    expect(model.pages).toHaveLength(2);
  });
});
