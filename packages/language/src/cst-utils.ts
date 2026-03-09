/**
 * CST utilities for extracting metadata from Concrete Syntax Tree nodes
 */

import type { AstNode } from "langium";

/**
 * Extract description from comments preceding an AST node
 */
export function extractDescription(node: AstNode): string | undefined {
  const cstNode = node.$cstNode;
  if (!cstNode?.container) return undefined;

  const container = cstNode.container;
  const children = container.content;
  const currentIndex = children.indexOf(cstNode);
  const comments: string[] = [];

  // Look at previous siblings only at the immediate level
  let foundNonWhitespace = false;
  for (let i = currentIndex - 1; i >= 0; i--) {
    const sibling = children[i];
    if (sibling.tokenType?.name === "SL_COMMENT") {
      const commentText = sibling.text.replace(/^\/\/\s*/, "").trim();
      if (commentText) {
        comments.unshift(commentText);
      }
      foundNonWhitespace = true;
    } else if (sibling.tokenType?.name === "WS") {
      const newlineCount = (sibling.text.match(/\n/g) || []).length;
      if (newlineCount > 1 && foundNonWhitespace) {
        break;
      }
    } else {
      break;
    }
  }

  return comments.length > 0 ? comments.join("\n") : undefined;
}
