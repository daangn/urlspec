/**
 * @urlspec/builder - Programmatic API to build URLSpec files
 */

import { writeFileSync } from "node:fs";
import { normalize, resolve } from "node:path";
import {
  createGlobalBlock,
  createPageDeclaration,
  createParameterDeclaration,
  createParamTypeDeclaration,
  createStringLiteralType,
  createStringType,
  createTypeReference,
  createUnionType,
  createURLSpecDocument,
  type GlobalBlock,
  type PageDeclaration,
  type ParameterDeclaration,
  type ParamTypeDeclaration,
  print,
  type Type,
  type URLSpecDocument,
} from "@urlspec/language";

// Re-export AST types
export type {
  GlobalBlock,
  PageDeclaration,
  ParameterDeclaration,
  ParamTypeDeclaration,
  Path,
  PathSegment,
  StringKeyword,
  StringLiteralType,
  Type,
  TypeReference,
  UnionType,
  URLSpecDocument,
} from "@urlspec/language";
// Re-export AST builder functions for convenience
export {
  createGlobalBlock,
  createPageDeclaration,
  createParameterDeclaration,
  createParamTypeDeclaration,
  createStringLiteralType,
  createStringType,
  createTypeReference,
  createUnionType,
  createURLSpecDocument,
  parsePath,
} from "@urlspec/language";

export type ParamType = "string" | string | string[];

export interface ParameterDefinition {
  name: string;
  type: ParamType;
  optional?: boolean;
}

export interface PageDefinition {
  name: string;
  path: string;
  parameters?: ParameterDefinition[];
  comment?: string;
}

/**
 * URLSpec builder class for programmatic generation of .urlspec files
 */
export class URLSpec {
  private paramTypes: Map<string, ParamType> = new Map();
  private globalParams: ParameterDefinition[] = [];
  private pages: PageDefinition[] = [];

  /**
   * Add a parameter type definition
   */
  addParamType(name: string, type: ParamType): void {
    this.paramTypes.set(name, type);
  }

  /**
   * Add a global parameter
   */
  addGlobalParam(param: ParameterDefinition): void {
    this.globalParams.push(param);
  }

  /**
   * Add a page
   */
  addPage(page: PageDefinition): void {
    this.pages.push(page);
  }

  /**
   * Build the URLSpec AST document
   */
  toAST(): URLSpecDocument {
    // Build param types
    const paramTypes: ParamTypeDeclaration[] = [];
    for (const [name, type] of this.paramTypes.entries()) {
      paramTypes.push(createParamTypeDeclaration(name, this.buildType(type)));
    }

    // Build global block
    let global: GlobalBlock | undefined;
    if (this.globalParams.length > 0) {
      const globalParameters = this.globalParams.map((p) =>
        this.buildParameter(p),
      );
      global = createGlobalBlock(globalParameters);
    }

    // Build pages
    const pages: PageDeclaration[] = this.pages.map((page) =>
      createPageDeclaration(
        page.name,
        page.path,
        page.parameters?.map((p) => this.buildParameter(p)),
      ),
    );

    return createURLSpecDocument({
      paramTypes,
      global,
      pages,
    });
  }

  /**
   * Convert to .urlspec format string
   */
  toString(): string {
    const ast = this.toAST();

    // Create a minimal LangiumDocument wrapper for print()
    const doc = {
      parseResult: {
        value: ast,
      },
      // biome-ignore lint/suspicious/noExplicitAny: to satisfy the type checker
    } as any;

    return print(doc);
  }

  /**
   * Write to file
   * @param path - The file path to write to
   * @param options - Optional configuration
   * @param options.allowedBaseDir - Optional base directory to restrict writes to
   */
  async writeFile(
    path: string,
    options?: { allowedBaseDir?: string },
  ): Promise<void> {
    this.validateFilePath(path, options?.allowedBaseDir);

    const content = this.toString();
    writeFileSync(path, content, "utf-8");
  }

  private validateFilePath(path: string, allowedBaseDir?: string): void {
    const normalizedPath = normalize(path);

    if (normalizedPath.includes("..")) {
      throw new Error(
        `Invalid file path: path traversal detected in "${path}"`,
      );
    }

    const resolvedPath = resolve(normalizedPath);
    const sensitiveDirectories = ["/etc", "/sys", "/proc", "/root"];
    for (const dir of sensitiveDirectories) {
      if (resolvedPath.startsWith(dir)) {
        throw new Error(
          `Invalid file path: cannot write to sensitive directory "${dir}"`,
        );
      }
    }

    if (allowedBaseDir) {
      const resolvedBaseDir = resolve(allowedBaseDir);
      const resolvedFilePath = resolve(normalizedPath);

      if (!resolvedFilePath.startsWith(resolvedBaseDir)) {
        throw new Error(
          `Invalid file path: "${path}" is outside allowed directory "${allowedBaseDir}"`,
        );
      }
    }
  }

  private buildType(type: ParamType): Type {
    if (typeof type === "string") {
      if (type === "string") {
        return createStringType();
      }
      // Check if it's a reference to a param type
      if (this.paramTypes.has(type)) {
        return createTypeReference(type);
      }
      // Single string literal
      return createStringLiteralType(type);
    }
    if (Array.isArray(type)) {
      // Union type
      return createUnionType(type);
    }
    // Default to string
    return createStringType();
  }

  private buildParameter(param: ParameterDefinition): ParameterDeclaration {
    return createParameterDeclaration(
      param.name,
      this.buildType(param.type),
      param.optional,
    );
  }
}
