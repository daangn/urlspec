import { readFileSync } from "node:fs";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { parseDocument } from "langium/test";
import type { URLSpecDocument } from "./__generated__/ast";
import { createURLSpecServices } from "./services";

const { URLSpec } = createURLSpecServices(EmptyFileSystem);

/**
 * Parse URLSpec source code and return the Langium AST
 * @param input URLSpec source code as string
 * @returns Parsed Langium AST document
 */
export async function parse(
  input: string,
): Promise<LangiumDocument<URLSpecDocument>> {
  const document = await parseDocument<URLSpecDocument>(URLSpec, input);
  // Run validation to populate diagnostics
  const diagnostics =
    await URLSpec.validation.DocumentValidator.validateDocument(document);
  // Manually set diagnostics on the document
  (document as any).diagnostics = diagnostics;

  const errors = diagnostics.filter((d) => d.severity === 1);
  if (errors.length > 0) {
    const messages = errors.map((d) => d.message).join("\n");
    throw new Error(`URLSpec validation failed:\n${messages}`);
  }

  return document;
}

/**
 * Parse URLSpec file and return the Langium AST
 * @param filePath Path to .urlspec file
 * @returns Parsed Langium AST document
 */
export async function parseFile(
  filePath: string,
): Promise<LangiumDocument<URLSpecDocument>> {
  const content = readFileSync(filePath, "utf-8");
  return parse(content);
}
