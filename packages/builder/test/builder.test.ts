import { describe, expect, it } from "vitest";
import { URLSpec } from "../src/index.js";

describe("URLSpec Builder", () => {
  it("should build basic spec", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.addPage({
      name: "list",
      path: "/jobs",
      parameters: [{ name: "category", type: "string", optional: true }],
    });

    const result = spec.toString();

    expect(result).toContain("namespace jobs;");
    expect(result).toContain("page list = /jobs {");
    expect(result).toContain("category?: string;");
  });

  it("should build with param types", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.addParamType("sortOrder", ["recent", "popular", "trending"]);
    spec.addPage({
      name: "list",
      path: "/jobs",
      parameters: [{ name: "sort", type: "sortOrder" }],
    });

    const result = spec.toString();

    expect(result).toContain(
      'param sortOrder = "recent" | "popular" | "trending";',
    );
    expect(result).toContain("sort: sortOrder;");
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

  it("should build with endpoint", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.setEndpoint("https://api.example.com");
    spec.addPage({
      name: "list",
      path: "/jobs",
    });

    const result = spec.toString();

    expect(result).toContain("namespace jobs;");
    expect(result).toContain('endpoint "https://api.example.com";');
    expect(result).toContain("page list = /jobs {");
  });

  it("should build complete example", () => {
    const spec = new URLSpec();

    spec.setNamespace("jobs");
    spec.setEndpoint("https://api.example.com");

    spec.addParamType("sortOrder", ["recent", "popular", "trending"]);
    spec.addParamType("jobStatus", ["active", "closed", "draft"]);

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
        { name: "sort", type: "sortOrder" },
      ],
    });

    spec.addPage({
      name: "detail",
      path: "/jobs/:job_id",
      parameters: [
        { name: "job_id", type: "string" },
        { name: "preview", type: ["true", "false"], optional: true },
        { name: "status", type: "jobStatus", optional: true },
      ],
    });

    const result = spec.toString();

    expect(result).toContain("namespace jobs;");
    expect(result).toContain('endpoint "https://api.example.com";');
    expect(result).toContain("param sortOrder");
    expect(result).toContain("param jobStatus");
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
        name: `${status}List`,
        path: `/jobs/${status}`,
        parameters: [{ name: "page", type: "string", optional: true }],
      });
    }

    const result = spec.toString();

    expect(result).toContain("page pendingList = /jobs/pending");
    expect(result).toContain("page approvedList = /jobs/approved");
    expect(result).toContain("page rejectedList = /jobs/rejected");
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
