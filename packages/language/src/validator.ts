import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { URLSpecAstType } from "./__generated__/ast";
import type { URLSpecServices } from "./services";

/**
 * Validation checks for the URLSpec language.
 *
 * Note: Parameter naming (snake_case) is enforced at the grammar level
 * using the IDENTIFIER terminal, which would require complex lookahead
 * to differentiate. Instead, we validate at the AST level here.
 */
export class URLSpecValidator {
  registerChecks(_services: URLSpecServices): ValidationChecks<URLSpecAstType> {
    const checks: ValidationChecks<URLSpecAstType> = {
      ParameterDeclaration: this.checkParameterNaming,
      PageDeclaration: this.checkPageDeclaration,
    };
    return checks;
  }

  /**
   * Validate parameter names follow snake_case convention.
   * Parameter names must start with a lowercase letter and contain only
   * lowercase letters, numbers, and underscores.
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
   * Validate that all path parameters are declared in the parameter block.
   * Path parameters (e.g., :job_id) must have a corresponding parameter declaration.
   */
  checkPageDeclaration = (
    page: URLSpecAstType["PageDeclaration"],
    accept: ValidationAcceptor,
  ): void => {
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
