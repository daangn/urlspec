import { describe, expect, it } from "vitest";
import { parse } from "../src/index.js";

describe("URLSpec Validation", () => {
  describe("Parameter key naming validation", () => {
    it("should accept parameter keys in snake_case", async () => {
      const input = `
namespace "jobs";

page list = /jobs {
  user_id: string;
  sort_order?: string;
  is_active: boolean;
}
`;

      const doc = await parse(input);
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should reject parameter keys in camelCase", async () => {
      const input = `
namespace "jobs";

page list = /jobs {
  userId: string;
  sortOrder?: string;
}
`;

      const doc = await parse(input);
      // Should have validation errors for camelCase parameter names
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject parameter keys in PascalCase", async () => {
      const input = `
namespace "jobs";

page list = /jobs {
  UserId: string;
  SortOrder?: string;
}
`;

      const doc = await parse(input);
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject parameter keys with mixed case", async () => {
      const input = `
namespace "jobs";

page list = /jobs {
  user_ID: string;
  Sort_Order?: string;
}
`;

      const doc = await parse(input);
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject parameter keys starting with uppercase", async () => {
      const input = `
namespace "jobs";

page list = /jobs {
  User_id: string;
}
`;

      const doc = await parse(input);
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should accept global parameter keys in snake_case", async () => {
      const input = `
namespace "jobs";

global {
  utm_source?: string;
  referrer?: string;
  is_preview: boolean;
}
`;

      const doc = await parse(input);
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should reject global parameter keys not in snake_case", async () => {
      const input = `
namespace "jobs";

global {
  utmSource?: string;
  referrerPage?: string;
}
`;

      const doc = await parse(input);
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("ParamType alias naming validation", () => {
    it("should accept ParamType names in any case (not restricted to snake_case)", async () => {
      const input = `
namespace "jobs";

param SortOrder = "recent" | "popular";
param jobStatus = "active" | "closed";
param sort_order = "asc" | "desc";

page list = /jobs {
  sort: SortOrder;
  status?: jobStatus;
  order: sort_order;
}
`;

      const doc = await parse(input);
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });

  describe("Path parameter validation", () => {
    it("should require path parameters to be declared in parameter block", async () => {
      const input = `
namespace "jobs";

page detail = /jobs/:job_id {
  preview?: boolean;
}
`;

      const doc = await parse(input);
      // Should have validation error for missing job_id declaration
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);

      // Check that the error message mentions the missing path parameter
      const hasJobIdError = errors.some((e) => e.message.includes("job_id"));
      expect(hasJobIdError).toBe(true);
    });

    it("should accept path parameters when declared in parameter block", async () => {
      const input = `
namespace "jobs";

page detail = /jobs/:job_id {
  job_id: string;
  preview?: boolean;
}
`;

      const doc = await parse(input);
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should require all path parameters to be declared", async () => {
      const input = `
namespace "jobs";

page comment = /articles/:article_id/comments/:comment_id {
  article_id: string;
  preview?: boolean;
}
`;

      const doc = await parse(input);
      // Should have validation error for missing comment_id declaration
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);

      const hasCommentIdError = errors.some((e) =>
        e.message.includes("comment_id"),
      );
      expect(hasCommentIdError).toBe(true);
    });

    it("should accept multiple path parameters when all are declared", async () => {
      const input = `
namespace "jobs";

page comment = /articles/:article_id/comments/:comment_id {
  article_id: string;
  comment_id: string;
  preview?: boolean;
}
`;

      const doc = await parse(input);
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });

    it("should validate path parameter naming follows snake_case", async () => {
      const input = `
namespace "jobs";

page detail = /jobs/:jobId {
  jobId: string;
}
`;

      const doc = await parse(input);
      // Path parameter names should follow snake_case, so jobId should fail
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("Combined validation scenarios", () => {
    it("should validate both parameter naming and path parameter declaration", async () => {
      const input = `
namespace "jobs";

page detail = /jobs/:job_id {
  sortOrder?: string;
  preview?: boolean;
}
`;

      const doc = await parse(input);
      expect(doc.diagnostics?.length ?? 0).toBeGreaterThan(0);
      const errors = doc.diagnostics?.filter((d) => d.severity === 1) ?? [];

      // Should have at least 2 errors: missing job_id + camelCase sortOrder
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it("should accept valid specification with all rules followed", async () => {
      const input = `
namespace "jobs";

param SortOrder = "recent" | "popular";
param JobStatus = "active" | "closed";

global {
  utm_source?: string;
  referrer?: string;
}

page list = /jobs {
  category?: string;
  sort_order: SortOrder;
}

page detail = /jobs/:job_id {
  job_id: string;
  preview?: boolean;
  status?: JobStatus;
}
`;

      const doc = await parse(input);
      expect(doc.parseResult.lexerErrors).toHaveLength(0);
      expect(doc.parseResult.parserErrors).toHaveLength(0);
      expect(doc.diagnostics ?? []).toHaveLength(0);
    });
  });
});
