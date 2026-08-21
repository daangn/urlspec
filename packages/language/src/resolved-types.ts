/**
 * Resolved (user-friendly) types for URLSpec
 * These are the types that users of the library will work with
 */

export interface ResolvedURLSpec {
  paramTypes: ResolvedParamType[];
  pages: ResolvedPage[];
  global?: ResolvedParameter[] | undefined;
}

export interface ResolvedParamType {
  name: string;
  type: ResolvedType;
  description?: string;
}

export interface ResolvedPage {
  name: string;
  path: string;
  pathSegments: ResolvedPathSegment[];
  parameters: ResolvedParameter[];
  variants?: ResolvedVariantGroup;
  description?: string;
  /**
   * Annotations declared above the page (`@key = value;`).
   *
   * URLSpec validates only the shape of these entries. Which keys are legal,
   * and what their values mean, is decided by whatever consumes the spec.
   * Absent when the page declares no annotations.
   */
  annotations?: ResolvedAnnotations;
}

/** Annotation keys mapped to their values, without the leading `@`. */
export type ResolvedAnnotations = Record<string, ResolvedAnnotationValue>;

export type ResolvedAnnotationValue = string | boolean | string[];

export interface ResolvedVariantGroup {
  discriminant: string;
  variants: ResolvedVariant[];
}

export interface ResolvedVariant {
  value: string;
  parameters: ResolvedParameter[];
  description?: string;
}

export interface ResolvedPathSegment {
  type: "static" | "parameter";
  value: string;
}

export interface ResolvedParameter {
  name: string;
  optional: boolean;
  type: ResolvedType;
  source: "global" | "page";
  description?: string;
}

export type ResolvedType =
  | { kind: "string" }
  | { kind: "literal"; value: string }
  | { kind: "union"; values: string[] };
