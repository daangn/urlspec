import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { URLSpecAstType } from "./__generated__/ast";
import type { URLSpecServices } from "./services";

/**
 * Validation checks for the URLSpec language.
 *
 * Note: Naming conventions (camelCase for page/param types)
 * are enforced at the AST level here.
 */
export class URLSpecValidator {
  registerChecks(_services: URLSpecServices): ValidationChecks<URLSpecAstType> {
    const checks: ValidationChecks<URLSpecAstType> = {
      ParamTypeDeclaration: this.checkParamTypeNaming,
      PageDeclaration: this.checkPageDeclaration,
      Annotation: this.checkAnnotationKeyNaming,
    };
    return checks;
  }

  /**
   * Validate param type names follow camelCase convention.
   */
  checkParamTypeNaming = (
    paramType: URLSpecAstType["ParamTypeDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

    if (!camelCasePattern.test(paramType.name)) {
      accept(
        "error",
        "Param type names must be in camelCase format (start with lowercase letter, followed by letters and numbers only).",
        {
          node: paramType,
          property: "name",
        },
      );
    }
  };

  /**
   * Validate annotation key naming.
   *
   * URLSpec does not know which annotation keys are legal — that is decided by
   * whoever consumes the spec. It does insist the key is spelled in camelCase,
   * so annotations read like the rest of the file.
   */
  checkAnnotationKeyNaming = (
    annotation: URLSpecAstType["Annotation"],
    accept: ValidationAcceptor,
  ): void => {
    const key = annotation.key.replace(/^@/, "");
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

    if (!camelCasePattern.test(key)) {
      accept(
        "error",
        `Annotation key '@${key}' must be in camelCase format (start with lowercase letter, followed by letters and numbers only).`,
        {
          node: annotation,
          property: "key",
        },
      );
    }
  };

  /**
   * Validate page declarations:
   * 1. Page names must be in camelCase
   * 2. All path parameters must be declared in the parameter block
   */
  checkPageDeclaration = (
    page: URLSpecAstType["PageDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    // Check page name starts with lowercase letter and contains only allowed characters
    const pageNamePattern = /^[a-z][a-zA-Z0-9._]*$/;
    if (!pageNamePattern.test(page.name)) {
      accept(
        "error",
        "Page names must start with a lowercase letter, followed by letters, numbers, dots, or underscores.",
        {
          node: page,
          property: "name",
        },
      );
    }

    // Annotations are a valid prefix of a page declaration, so `@key = value;`
    // with no page after it error-recovers into a PageDeclaration with nothing
    // else filled in. Say what is actually wrong, and stop before the checks
    // below reach through the missing path.
    if (!page.path) {
      if (page.annotations && page.annotations.length > 0) {
        accept("error", "Annotations must be followed by a page declaration.", {
          node: page,
        });
      }
      return;
    }

    // Reject the same annotation key twice on one page — the second would
    // silently win, and there is no sensible merge for an unknown key.
    const seenAnnotationKeys = new Set<string>();
    for (const annotation of page.annotations ?? []) {
      if (seenAnnotationKeys.has(annotation.key)) {
        accept("error", `Duplicate annotation key '${annotation.key}'.`, {
          node: annotation,
          property: "key",
        });
      }
      seenAnnotationKeys.add(annotation.key);
    }

    // Extract path parameter names from the path
    const pathParams = new Set<string>();
    if (page.path.segments) {
      for (const segment of page.path.segments) {
        if (segment.parameter) {
          pathParams.add(segment.parameter);
        }
      }
    }

    // Check if all path parameters are declared in the parameter block
    const declaredParams = new Set(page.parameters.map((p) => p.name));

    for (const pathParam of pathParams) {
      if (!declaredParams.has(pathParam)) {
        accept(
          "error",
          `Path parameter '${pathParam}' must be declared in the parameter block.`,
          {
            node: page,
            property: "path",
          },
        );
      }
    }

    // Validate when clauses
    if (page.whenClauses && page.whenClauses.length > 0) {
      const discriminants = new Set(
        page.whenClauses.map((w) => w.discriminant),
      );
      if (discriminants.size > 1) {
        accept(
          "error",
          `All 'when' clauses must use the same discriminant parameter. Found: ${[...discriminants].join(", ")}.`,
          { node: page },
        );
      }

      const seenValues = new Set<string>();
      for (const whenClause of page.whenClauses) {
        const val = whenClause.value;
        if (seenValues.has(val)) {
          accept("error", `Duplicate 'when' clause value ${val}.`, {
            node: whenClause,
            property: "value",
          });
        }
        seenValues.add(val);
      }

      const discriminant = page.whenClauses[0]?.discriminant;
      if (discriminant && declaredParams.has(discriminant)) {
        accept(
          "error",
          `Discriminant '${discriminant}' must not be declared in the parameter block when using 'when' clauses.`,
          { node: page },
        );
      }
    }
  };
}
