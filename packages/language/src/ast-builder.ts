/**
 * AST Builder - Programmatic API to construct URLSpec AST nodes
 */

import type {
  GlobalBlock,
  NamespaceDeclaration,
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
} from "./__generated__/ast";

/**
 * Create a namespace declaration
 */
export function createNamespace(name: string): NamespaceDeclaration {
  return {
    $type: "NamespaceDeclaration",
    name,
  } as NamespaceDeclaration;
}

/**
 * Create a string keyword type
 */
export function createStringType(): StringKeyword {
  return {
    $type: "StringKeyword",
    value: "string",
  } as StringKeyword;
}

/**
 * Create a string literal type
 */
export function createStringLiteralType(value: string): StringLiteralType {
  return {
    $type: "StringLiteralType",
    value,
  } as StringLiteralType;
}

/**
 * Create a union type
 */
export function createUnionType(values: string[]): UnionType {
  return {
    $type: "UnionType",
    types: values.map((v) => createStringLiteralType(v)),
  } as UnionType;
}

/**
 * Create a type reference
 */
export function createTypeReference(refName: string): TypeReference {
  return {
    $type: "TypeReference",
    ref: {
      $refText: refName,
    },
  } as TypeReference;
}

/**
 * Create a parameter type declaration
 */
export function createParamTypeDeclaration(
  name: string,
  type: Type,
): ParamTypeDeclaration {
  return {
    $type: "ParamTypeDeclaration",
    name,
    type,
  } as ParamTypeDeclaration;
}

/**
 * Create a parameter declaration
 */
export function createParameterDeclaration(
  name: string,
  type: Type,
  optional?: boolean,
): ParameterDeclaration {
  return {
    $type: "ParameterDeclaration",
    name,
    type,
    optional: optional ? "?" : undefined,
  } as ParameterDeclaration;
}

/**
 * Create a path segment (static or parameter)
 */
export function createPathSegment(
  value: string,
  isParameter: boolean,
): PathSegment {
  return {
    $type: "PathSegment",
    static: isParameter ? undefined : value,
    parameter: isParameter ? value : undefined,
  } as PathSegment;
}

/**
 * Parse a path string into segments
 * Example: "/jobs/:job_id" -> [static("jobs"), parameter("job_id")]
 */
export function parsePath(pathStr: string): Path {
  const parts = pathStr.split("/").filter((p) => p.length > 0);
  const segments: PathSegment[] = parts.map((part) => {
    if (part.startsWith(":")) {
      return createPathSegment(part.slice(1), true);
    }
    return createPathSegment(part, false);
  });

  return {
    $type: "Path",
    segments,
  } as Path;
}

/**
 * Create a global block
 */
export function createGlobalBlock(
  parameters: ParameterDeclaration[],
): GlobalBlock {
  return {
    $type: "GlobalBlock",
    parameters,
  } as GlobalBlock;
}

/**
 * Create a page declaration
 */
export function createPageDeclaration(
  name: string,
  pathStr: string,
  parameters?: ParameterDeclaration[],
): PageDeclaration {
  return {
    $type: "PageDeclaration",
    name,
    path: parsePath(pathStr),
    parameters: parameters || [],
  } as PageDeclaration;
}

/**
 * Create a complete URLSpec document
 */
export function createURLSpecDocument(options: {
  namespace: string;
  paramTypes?: ParamTypeDeclaration[];
  global?: GlobalBlock;
  pages?: PageDeclaration[];
}): URLSpecDocument {
  return {
    $type: "URLSpecDocument",
    namespace: createNamespace(options.namespace),
    paramTypes: options.paramTypes || [],
    global: options.global,
    pages: options.pages || [],
  } as URLSpecDocument;
}
