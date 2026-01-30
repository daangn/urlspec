import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { URLSpecAstType } from "./__generated__/ast";
import type { URLSpecServices } from "./services";

/**
 * Validation checks for the URLSpec language.
 *
 * Note: Naming conventions (camelCase for namespace/page/param types, snake_case for parameters)
 * are enforced at the AST level here.
 */
export class URLSpecValidator {
  registerChecks(_services: URLSpecServices): ValidationChecks<URLSpecAstType> {
    const checks: ValidationChecks<URLSpecAstType> = {
      NamespaceDeclaration: this.checkNamespaceNaming,
      ParameterDeclaration: this.checkParameterNaming,
      ParamTypeDeclaration: this.checkParamTypeNaming,
      PageDeclaration: this.checkPageDeclaration,
    };
    return checks;
  }

  /**
   * Validate namespace names follow camelCase convention.
   */
  checkNamespaceNaming = (
    namespace: URLSpecAstType["NamespaceDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

    if (!camelCasePattern.test(namespace.name)) {
      accept(
        "error",
        "Namespace must be in camelCase format (start with lowercase letter, followed by letters and numbers only).",
        {
          node: namespace,
          property: "name",
        },
      );
    }
  };

  /**
   * Validate parameter names follow snake_case convention.
   */
  checkParameterNaming = (
    param: URLSpecAstType["ParameterDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    const snakeCasePattern = /^[a-z][a-z0-9_]*$/;

    if (!snakeCasePattern.test(param.name)) {
      accept(
        "error",
        "Parameter names must be in snake_case format (lowercase letters, numbers, and underscores only, starting with a lowercase letter).",
        {
          node: param,
          property: "name",
        },
      );
    }
  };

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
   * Validate page declarations:
   * 1. Page names must be in camelCase
   * 2. All path parameters must be declared in the parameter block
   */
  checkPageDeclaration = (
    page: URLSpecAstType["PageDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
    // Check page name is camelCase
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
    if (!camelCasePattern.test(page.name)) {
      accept(
        "error",
        "Page names must be in camelCase format (start with lowercase letter, followed by letters and numbers only).",
        {
          node: page,
          property: "name",
        },
      );
    }

    // Extract path parameter names from the path
    const pathParams = new Set<string>();
    for (const segment of page.path.segments) {
      if (segment.parameter) {
        pathParams.add(segment.parameter);
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
  };
}
