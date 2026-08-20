/**
 * AST Builder - Programmatic API to construct URLSpec AST nodes
 */

import type {
  Annotation,
  AnnotationBoolean,
  AnnotationList,
  AnnotationString,
  AnnotationValue,
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
  WhenClause,
} from "./__generated__/ast";

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
  description?: string,
): ParamTypeDeclaration {
  const node = {
    $type: "ParamTypeDeclaration",
    name,
    type,
  } as ParamTypeDeclaration;
  if (description) {
    (node as any).$description = description;
  }
  return node;
}

/**
 * Create a parameter declaration
 */
export function createParameterDeclaration(
  name: string,
  type: Type,
  optional?: boolean,
  description?: string,
): ParameterDeclaration {
  const node = {
    $type: "ParameterDeclaration",
    name,
    type,
    optional: optional ? "?" : undefined,
  } as ParameterDeclaration;
  if (description) {
    (node as any).$description = description;
  }
  return node;
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
 * Example: "/jobs/:job_id" -> [static("/jobs"), parameter("job_id")]
 * Example: "/" -> root path
 */
export function parsePath(pathStr: string): Path {
  // Handle root path
  if (pathStr === "/") {
    return {
      $type: "Path",
      root: "/",
      segments: [],
    } as Path;
  }

  const parts = pathStr.split("/").filter((p) => p.length > 0);
  const segments: PathSegment[] = parts.map((part) => {
    if (part.startsWith(":")) {
      return createPathSegment(part.slice(1), true);
    }
    // Static segments now include the leading slash
    return createPathSegment(`/${part}`, false);
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
 * Create a when clause for discriminated union parameters
 */
export function createWhenClause(
  discriminant: string,
  value: string,
  parameters: ParameterDeclaration[],
  description?: string,
): WhenClause {
  const node = {
    $type: "WhenClause",
    discriminant,
    value: value.startsWith('"') ? value : `"${value}"`,
    parameters,
  } as WhenClause;
  if (description) {
    (node as any).$description = description;
  }
  return node;
}

/**
 * Create an annotation string value
 */
export function createAnnotationString(value: string): AnnotationString {
  return {
    $type: "AnnotationString",
    value,
  } as AnnotationString;
}

/**
 * Create an annotation boolean value
 */
export function createAnnotationBoolean(value: boolean): AnnotationBoolean {
  return {
    $type: "AnnotationBoolean",
    value: value ? "true" : "false",
  } as AnnotationBoolean;
}

/**
 * Create an annotation list value
 */
export function createAnnotationList(values: string[]): AnnotationList {
  return {
    $type: "AnnotationList",
    values,
  } as AnnotationList;
}

/**
 * Create an annotation. The leading `@` is added when missing.
 */
export function createAnnotation(
  key: string,
  value: AnnotationValue,
): Annotation {
  return {
    $type: "Annotation",
    key: key.startsWith("@") ? key : `@${key}`,
    value,
  } as Annotation;
}

/**
 * Create an annotation from a plain JavaScript value
 */
export function createAnnotationFromValue(
  key: string,
  value: string | boolean | string[],
): Annotation {
  if (typeof value === "boolean") {
    return createAnnotation(key, createAnnotationBoolean(value));
  }
  if (Array.isArray(value)) {
    return createAnnotation(key, createAnnotationList(value));
  }
  return createAnnotation(key, createAnnotationString(value));
}

/**
 * Create a page declaration
 */
export function createPageDeclaration(
  name: string,
  pathStr: string,
  parameters?: ParameterDeclaration[],
  description?: string,
  whenClauses?: WhenClause[],
  annotations?: Annotation[],
): PageDeclaration {
  const node = {
    $type: "PageDeclaration",
    name,
    path: parsePath(pathStr),
    parameters: parameters || [],
    whenClauses: whenClauses || [],
    annotations: annotations || [],
  } as PageDeclaration;
  if (description) {
    (node as any).$description = description;
  }
  return node;
}

/**
 * Create a complete URLSpec document
 */
export function createURLSpecDocument(options: {
  paramTypes?: ParamTypeDeclaration[];
  global?: GlobalBlock;
  pages?: PageDeclaration[];
}): URLSpecDocument {
  return {
    $type: "URLSpecDocument",
    paramTypes: options.paramTypes || [],
    global: options.global,
    pages: options.pages || [],
  } as URLSpecDocument;
}
