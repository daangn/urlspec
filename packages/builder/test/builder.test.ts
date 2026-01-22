import { describe, expect, it } from "vitest";
import { URLSpec } from "../src/index.js";

describe("URLSpec Builder", () => {
  it("should build basic spec", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.addEndpoint("production", "https://jobs.karrotwebview.com");
    spec.addPage({
      name: "list",
      path: "/jobs",
      parameters: [{ name: "category", type: "string", optional: true }],
    });

    const result = spec.toString();

    expect(result).toContain('namespace "jobs";');
    expect(result).toContain(
      'endpoint production = "https://jobs.karrotwebview.com";',
    );
    expect(result).toContain("page list = /jobs {");
    expect(result).toContain("category?: string;");
  });

  it("should build with param types", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.addParamType("sort_order", ["recent", "popular", "trending"]);
    spec.addPage({
      name: "list",
      path: "/jobs",
      parameters: [{ name: "sort", type: "sort_order" }],
    });

    const result = spec.toString();

    expect(result).toContain(
      'param sort_order = "recent" | "popular" | "trending";',
    );
    expect(result).toContain("sort: sort_order;");
  });

  it("should build with global parameters", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.addGlobalParam({
      name: "utm_source",
      type: "string",
      optional: true,
    });
    spec.addPage({
      name: "list",
      path: "/jobs",
    });

    const result = spec.toString();

    expect(result).toContain("global {");
    expect(result).toContain("utm_source?: string;");
  });

  it("should build complete example", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.addEndpoint("alpha", "https://jobs.alpha.karrotwebview.com");
    spec.addEndpoint("production", "https://jobs.karrotwebview.com");

    spec.addParamType("sort_order", ["recent", "popular", "trending"]);
    spec.addParamType("job_status", ["active", "closed", "draft"]);

    spec.addGlobalParam({
      name: "referrer",
      type: "string",
      optional: true,
    });

    spec.addPage({
      name: "list",
      path: "/jobs",
      parameters: [
        { name: "category", type: "string", optional: true },
        { name: "sort", type: "sort_order" },
      ],
    });

    spec.addPage({
      name: "detail",
      path: "/jobs/:job_id",
      parameters: [
        { name: "job_id", type: "string" },
        { name: "preview", type: "boolean", optional: true },
        { name: "status", type: "job_status", optional: true },
      ],
    });

    const result = spec.toString();

    expect(result).toContain('namespace "jobs";');
    expect(result).toContain("endpoint alpha");
    expect(result).toContain("endpoint production");
    expect(result).toContain("param sort_order");
    expect(result).toContain("param job_status");
    expect(result).toContain("global {");
    expect(result).toContain("page list");
    expect(result).toContain("page detail");
  });

  it("should support dynamic page generation", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");

    const statuses = ["pending", "approved", "rejected"];
    for (const status of statuses) {
      spec.addPage({
        name: `${status}_list`,
        path: `/jobs/${status}`,
        parameters: [{ name: "page", type: "number", optional: true }],
      });
    }

    const result = spec.toString();

    expect(result).toContain("page pending_list = /jobs/pending");
    expect(result).toContain("page approved_list = /jobs/approved");
    expect(result).toContain("page rejected_list = /jobs/rejected");
  });

  describe("Security - Path Traversal Prevention", () => {
    it("should reject paths with .. traversal sequences", async () => {
      const spec = new URLSpec();
      spec.setNamespace("test");

      await expect(spec.writeFile("../../../etc/passwd")).rejects.toThrow(
        "path traversal detected",
      );
    });

    it("should reject paths to sensitive system directories", async () => {
      const spec = new URLSpec();
      spec.setNamespace("test");

      await expect(spec.writeFile("/etc/hosts")).rejects.toThrow(
        "cannot write to sensitive directory",
      );

      await expect(spec.writeFile("/sys/kernel/config")).rejects.toThrow(
        "cannot write to sensitive directory",
      );

      await expect(spec.writeFile("/proc/version")).rejects.toThrow(
        "cannot write to sensitive directory",
      );

      await expect(spec.writeFile("/root/.bashrc")).rejects.toThrow(
        "cannot write to sensitive directory",
      );
    });

    it("should reject paths outside allowed base directory", async () => {
      const spec = new URLSpec();
      spec.setNamespace("test");

      await expect(
        spec.writeFile("/tmp/test.urlspec", { allowedBaseDir: "/home/user" }),
      ).rejects.toThrow("outside allowed directory");
    });

    it("should allow valid paths within allowed base directory", async () => {
      const spec = new URLSpec();
      spec.setNamespace("test");
      spec.addPage({ name: "home", path: "/" });

      // This should not throw (but will fail to write without proper setup)
      // We're just testing that validation passes
      const tmpDir = "/tmp";
      await expect(
        spec.writeFile(`${tmpDir}/test.urlspec`, { allowedBaseDir: tmpDir }),
      ).resolves.not.toThrow();
    });

    it("should normalize paths before validation", async () => {
      const spec = new URLSpec();
      spec.setNamespace("test");

      // These should be rejected even with path obfuscation
      await expect(spec.writeFile("/tmp/../etc/passwd")).rejects.toThrow();

      await expect(spec.writeFile("/tmp/./../../etc/passwd")).rejects.toThrow();
    });
  });
});
