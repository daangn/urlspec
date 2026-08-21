import type { AstNode, LangiumDocument } from "langium";
import type {
  Annotation,
  AnnotationBoolean,
  AnnotationList,
  AnnotationString,
  AnnotationValue,
  PageDeclaration,
  ParameterDeclaration,
  PathSegment,
  StringKeyword,
  StringLiteralType,
  Type,
  TypeReference,
  UnionType,
  URLSpecDocument,
} from "./__generated__/ast";
import { extractLeadingDescription } from "./cst-utils";

/** Column past which an annotation list is broken onto multiple lines. */
const MAX_LINE_WIDTH = 80;

/**
 * Get description from a node: check $description (builder) or CST (parsed)
 */
function getDescription(node: AstNode): string | undefined {
  const builderDesc = (node as any).$description;
  if (builderDesc) return builderDesc;
  return extractLeadingDescription(node);
}

/**
 * Convert a description string into formatted comment lines
 */
function descriptionLines(desc: string | undefined, indent: string): string[] {
  if (!desc) return [];
  return desc.split("\n").map((line) => `${indent}// ${line}`);
}

/**
 * Print Langium AST back to .urlspec format
 */
export function print(doc: LangiumDocument<URLSpecDocument>): string {
  const model = doc.parseResult.value;
  const lines: string[] = [];

  // Param types
  if (model.paramTypes.length > 0) {
    for (const paramType of model.paramTypes) {
      lines.push(...descriptionLines(getDescription(paramType), ""));
      lines.push(`param ${paramType.name} = ${printType(paramType.type)};`);
    }
    lines.push("");
  }

  // Global block
  if (model.global) {
    lines.push("global {");
    for (const param of model.global.parameters) {
      lines.push(...descriptionLines(getDescription(param), "  "));
      lines.push(`  ${printParameter(param)}`);
    }
    lines.push("}");
    lines.push("");
  }

  // Pages
  for (const page of model.pages) {
    lines.push(...descriptionLines(getDescription(page), ""));
    for (const annotation of page.annotations ?? []) {
      lines.push(...printAnnotation(annotation));
    }
    lines.push(printPage(page));
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function printPage(page: PageDeclaration): string {
  const lines: string[] = [];

  const path = page.path.root
    ? "/"
    : page.path.segments.map(printPathSegment).join("");
  lines.push(`page ${page.name} = ${path} {`);

  for (const param of page.parameters) {
    lines.push(...descriptionLines(getDescription(param), "  "));
    lines.push(`  ${printParameter(param)}`);
  }

  for (const whenClause of page.whenClauses) {
    const quotedValue = whenClause.value.startsWith('"')
      ? whenClause.value
      : `"${whenClause.value}"`;
    lines.push(...descriptionLines(getDescription(whenClause), "  "));
    lines.push(`  when ${whenClause.discriminant} = ${quotedValue} {`);
    for (const param of whenClause.parameters) {
      lines.push(...descriptionLines(getDescription(param), "    "));
      lines.push(`    ${printParameter(param)}`);
    }
    lines.push("  }");
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * Print an annotation as one or more lines. Lists are broken across lines when
 * the single-line form would run past MAX_LINE_WIDTH.
 */
function printAnnotation(annotation: Annotation): string[] {
  const key = annotation.key.startsWith("@")
    ? annotation.key
    : `@${annotation.key}`;
  const singleLine = `${key} = ${printAnnotationValue(annotation.value)};`;

  if (
    singleLine.length <= MAX_LINE_WIDTH ||
    !isAnnotationList(annotation.value)
  ) {
    return [singleLine];
  }

  return [
    `${key} = [`,
    ...annotation.value.values.map((v) => `  ${quote(v)},`),
    "];",
  ];
}

function printAnnotationValue(value: AnnotationValue): string {
  if (isAnnotationString(value)) {
    return quote(value.value);
  }

  if (isAnnotationBoolean(value)) {
    return value.value;
  }

  if (isAnnotationList(value)) {
    return `[${value.values.map(quote).join(", ")}]`;
  }

  return "unknown";
}

/** Values arrive unquoted from the parser but quoted from the AST builder. */
function quote(value: string): string {
  return value.startsWith('"') ? value : `"${value}"`;
}

function printPathSegment(segment: PathSegment): string {
  if (segment.static) {
    // PATH_SEGMENT now includes the leading slash
    return segment.static;
  }
  if (segment.parameter) {
    return `/:${segment.parameter}`;
  }
  return "";
}

function printParameter(param: ParameterDeclaration): string {
  const optional = param.optional ? "?" : "";
  return `${param.name}${optional}: ${printType(param.type)};`;
}

function printType(type: Type): string {
  if (isStringKeyword(type)) {
    return "string";
  }

  if (isStringLiteralType(type)) {
    // Keep the quotes in the string literal value
    return type.value.startsWith('"') ? type.value : `"${type.value}"`;
  }

  if (isUnionType(type)) {
    return type.types
      .map((t) => (t.value.startsWith('"') ? t.value : `"${t.value}"`))
      .join(" | ");
  }

  if (isTypeReference(type)) {
    return type.ref?.$refText || "unknown";
  }

  return "unknown";
}

// Type guards
function isAnnotationString(value: AnnotationValue): value is AnnotationString {
  return "$type" in value && value.$type === "AnnotationString";
}

function isAnnotationBoolean(
  value: AnnotationValue,
): value is AnnotationBoolean {
  return "$type" in value && value.$type === "AnnotationBoolean";
}

function isAnnotationList(value: AnnotationValue): value is AnnotationList {
  return "$type" in value && value.$type === "AnnotationList";
}

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
