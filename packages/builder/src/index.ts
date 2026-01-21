/**
 * @urlspec/builder - Programmatic API to build URLSpec files
 */

import { writeFileSync } from "node:fs";
import {
  createEndpoint,
  createGlobalBlock,
  createPageDeclaration,
  createParameterDeclaration,
  createParamTypeDeclaration,
  createPrimitiveType,
  createStringLiteralType,
  createTypeReference,
  createUnionType,
  createURLSpecDocument,
  type EndpointDeclaration,
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
  EndpointDeclaration,
  GlobalBlock,
  NamespaceDeclaration,
  PageDeclaration,
  ParameterDeclaration,
  ParamTypeDeclaration,
  Path,
  PathSegment,
  PrimitiveType,
  StringLiteralType,
  Type,
  TypeReference,
  UnionType,
  URLSpecDocument,
} from "@urlspec/language";
// Re-export AST builder functions for convenience
export {
  createEndpoint,
  createGlobalBlock,
  createNamespace,
  createPageDeclaration,
  createParameterDeclaration,
  createParamTypeDeclaration,
  createPrimitiveType,
  createStringLiteralType,
  createTypeReference,
  createUnionType,
  createURLSpecDocument,
  parsePath,
} from "@urlspec/language";

export type ParamType = "string" | "number" | "boolean" | string | string[];

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
  private namespace?: string;
  private endpoints: Array<{ name: string; url: string }> = [];
  private paramTypes: Map<string, ParamType> = new Map();
  private globalParams: ParameterDefinition[] = [];
  private pages: PageDefinition[] = [];

  /**
   * Set the namespace for the URLSpec
   */
  setNamespace(name: string): void {
    this.namespace = name;
  }

  /**
   * Add an endpoint
   */
  addEndpoint(name: string, url: string): void {
    this.endpoints.push({ name, url });
  }

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
    if (!this.namespace) {
      throw new Error("Namespace is required");
    }

    // Build endpoints
    const endpoints: EndpointDeclaration[] = this.endpoints.map((ep) =>
      createEndpoint(ep.name, ep.url),
    );

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
      namespace: this.namespace,
      endpoints,
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
   */
  async writeFile(path: string): Promise<void> {
    const content = this.toString();
    writeFileSync(path, content, "utf-8");
  }

  private buildType(type: ParamType): Type {
    if (typeof type === "string") {
      if (type === "string" || type === "number" || type === "boolean") {
        return createPrimitiveType(type);
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
    return createPrimitiveType("string");
  }

  private buildParameter(param: ParameterDefinition): ParameterDeclaration {
    return createParameterDeclaration(
      param.name,
      this.buildType(param.type),
      param.optional,
    );
  }
}
