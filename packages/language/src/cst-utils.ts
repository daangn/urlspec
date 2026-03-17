/**
 * CST utilities for extracting metadata from Concrete Syntax Tree nodes
 */

import type { AstNode, LeafCstNode } from "langium";

/**
 * Extract description from comments preceding an AST node.
 * Stops at a blank line between comment blocks.
 */
export function extractDescription(node: AstNode): string | undefined {
  const cstNode = node.$cstNode;
  if (!cstNode?.container) return undefined;

  const container = cstNode.container;
  const children = container.content;
  const currentIndex = children.indexOf(cstNode);
  const comments: string[] = [];

  // nextCommentLine tracks the start line of the most recently collected
  // comment (the one closest to the node). We use it to detect blank lines
  // between comment groups: if the gap between two adjacent SL_COMMENTs is
  // more than 1 line, there is a blank line between them and we stop.
  let nextCommentLine: number | undefined;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const sibling = children[i] as LeafCstNode | { tokenType: undefined };
    if (!("tokenType" in sibling) || sibling.tokenType === undefined) {
      // Composite node (another declaration) — stop
      break;
    }
    if (sibling.tokenType.name === "SL_COMMENT") {
      const leaf = sibling as LeafCstNode;
      // If there is a blank line between this comment and the next one
      // we already collected, stop before including this comment.
      if (
        nextCommentLine !== undefined &&
        nextCommentLine - leaf.range.end.line > 1
      ) {
        break;
      }
      const commentText = leaf.text.replace(/^\/\/\s*/, "").trim();
      if (commentText) {
        comments.unshift(commentText);
      }
      nextCommentLine = leaf.range.start.line;
    }
    // WS tokens are not present in container.content, so no else branch needed
  }

  return comments.length > 0 ? comments.join("\n") : undefined;
}
