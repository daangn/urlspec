import { describe, expect, it } from "vitest";
import { parse, print } from "../src/index.js";

describe("URLSpec Printer", () => {
  it("should print and parse roundtrip", async () => {
    const input = `namespace "jobs";

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
  preview?: "true" | "false";
  status?: job_status;
}
`;

    const doc1 = await parse(input);
    const printed = print(doc1);

    // Parse again
    const doc2 = await parse(printed);

    // Should have no errors
    expect(doc2.parseResult.lexerErrors).toHaveLength(0);
    expect(doc2.parseResult.parserErrors).toHaveLength(0);

    // Print again - should be identical
    const printed2 = print(doc2);
    expect(printed2).toBe(printed);
  });

  it("should print basic spec", async () => {
    const input = `
namespace "test";

page home = /home {
  query?: string;
}
`;

    const doc = await parse(input);
    const printed = print(doc);

    expect(printed).toContain('namespace "test";');
    expect(printed).toContain("page home = /home {");
    expect(printed).toContain("query?: string;");
  });

  it("should print path parameters", async () => {
    const input = `
namespace "test";

page detail = /items/:item_id {
  item_id: string;
}
`;

    const doc = await parse(input);
    const printed = print(doc);

    expect(printed).toContain("/items/:item_id");
  });
});
