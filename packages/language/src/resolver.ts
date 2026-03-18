import type { LangiumDocument } from "langium";
import type {
  PageDeclaration,
  ParameterDeclaration,
  StringKeyword,
  StringLiteralType,
  Type,
  TypeReference,
  UnionType,
  URLSpecDocument,
  WhenClause,
} from "./__generated__/ast";
import { extractDescription } from "./cst-utils";
import type {
  ResolvedPage,
  ResolvedParameter,
  ResolvedParamType,
  ResolvedPathSegment,
  ResolvedType,
  ResolvedURLSpec,
  ResolvedVariant,
  ResolvedVariantGroup,
} from "./resolved-types";

/**
 * Resolve Langium AST to user-friendly ResolvedURLSpec
 * - Resolves type references to actual types
 * - Merges global parameters into each page
 * - Parses path segments
 * - Extracts descriptions from comments
 */
export function resolve(
  doc: LangiumDocument<URLSpecDocument>,
): ResolvedURLSpec {
  const model = doc.parseResult.value;

  // Resolve param types
  const paramTypes: ResolvedParamType[] = model.paramTypes.map((pt) => ({
    name: pt.name,
    type: resolveType(pt.type),
    description: extractDescription(pt),
  }));

  // Resolve global parameters (if exists)
  const globalParams: ResolvedParameter[] = model.global
    ? model.global.parameters.map((p) => resolveParameter(p, "global"))
    : [];

  // Resolve pages
  const pages: ResolvedPage[] = model.pages.map((page) =>
    resolvePage(page, globalParams),
  );

  return {
    paramTypes,
    pages,
    global: globalParams.length > 0 ? globalParams : undefined,
  };
}

function resolvePage(
  page: PageDeclaration,
  globalParams: ResolvedParameter[],
): ResolvedPage {
  // Handle root path
  if (page.path.root) {
    const rootPageParams = page.parameters.map((p) =>
      resolveParameter(p, "page"),
    );
    const rootParameters = [...globalParams, ...rootPageParams];
    const rootVariants = resolveVariants(page.whenClauses, rootParameters);
    return {
      name: page.name,
      path: "/",
      pathSegments: [],
      parameters: rootParameters,
      variants: rootVariants,
      description: extractDescription(page),
    };
  }

  // Parse path segments
  const pathSegments: ResolvedPathSegment[] = page.path.segments.map((seg) => {
    if (seg.static) {
      // PATH_SEGMENT now includes the leading slash, so remove it for the value
      return { type: "static" as const, value: seg.static.substring(1) };
    }
    if (seg.parameter) {
      return { type: "parameter" as const, value: seg.parameter };
    }
    throw new Error("Invalid path segment");
  });

  // Build full path string
  const path = pathSegments
    .map((seg) => (seg.type === "static" ? `/${seg.value}` : `/:${seg.value}`))
    .join("");

  // Resolve page-specific parameters
  const pageParams: ResolvedParameter[] = page.parameters.map((p) =>
    resolveParameter(p, "page"),
  );

  // Merge global and page parameters
  const parameters = [...globalParams, ...pageParams];

  // Resolve when clauses (discriminated union)
  const variants: ResolvedVariantGroup | undefined = resolveVariants(
    page.whenClauses,
    parameters,
  );

  return {
    name: page.name,
    path,
    pathSegments,
    parameters,
    variants,
    description: extractDescription(page),
  };
}

/**
 * Resolve when clauses into a ResolvedVariantGroup.
 * Also appends the discriminant parameter (as a union of all variant values)
 * to the `parameters` array so existing consumers see it alongside other params.
 */
function resolveVariants(
  whenClauses: WhenClause[],
  parameters: ResolvedParameter[],
): ResolvedVariantGroup | undefined {
  if (!whenClauses || whenClauses.length === 0) return undefined;

  // biome-ignore lint/style/noNonNullAssertion: length checked above
  const discriminant = whenClauses[0]!.discriminant;
  const values = whenClauses.map((w) => w.value.replace(/^"|"$/g, ""));

  // Add discriminant as a required parameter with the union of all variant values
  const discriminantType: ResolvedType =
    values.length === 1
      ? { kind: "literal", value: values[0] ?? "" }
      : { kind: "union", values };

  parameters.push({
    name: discriminant,
    optional: false,
    type: discriminantType,
    source: "page",
  });

  const variants: ResolvedVariant[] = whenClauses.map((w) => ({
    value: w.value.replace(/^"|"$/g, ""),
    parameters: w.parameters.map((p) => resolveParameter(p, "page")),
  }));

  return { discriminant, variants };
}

function resolveParameter(
  param: ParameterDeclaration,
  source: "global" | "page",
): ResolvedParameter {
  return {
    name: param.name,
    optional: !!param.optional,
    type: resolveType(param.type),
    source,
    description: extractDescription(param),
  };
}

function resolveType(type: Type): ResolvedType {
  if (isStringKeyword(type)) {
    return {
      kind: "string",
    };
  }

  if (isStringLiteralType(type)) {
    return {
      kind: "literal",
      value: type.value.replace(/^"|"$/g, ""),
    };
  }

  if (isUnionType(type)) {
    return {
      kind: "union",
      values: type.types.map((t) => t.value.replace(/^"|"$/g, "")),
    };
  }

  if (isTypeReference(type)) {
    // Resolve the referenced type
    if (type.ref?.ref) {
      return resolveType(type.ref.ref.type);
    }
    throw new Error(`Unresolved type reference: ${type.ref?.$refText}`);
  }

  throw new Error(`Unknown type: ${JSON.stringify(type)}`);
}

// Type guards
function isStringKeyword(type: Type): type is StringKeyword {
  return "$type" in type && type.$type === "StringKeyword";
}

function isStringLiteralType(type: Type): type is StringLiteralType {
  return "$type" in type && type.$type === "StringLiteralType";
}

function isUnionType(type: Type): type is UnionType {
  return "$type" in type && type.$type === "UnionType";
}

function isTypeReference(type: Type): type is TypeReference {
  return "$type" in type && type.$type === "TypeReference";
}
