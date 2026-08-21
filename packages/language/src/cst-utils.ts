/**
 * CST utilities for extracting metadata from Concrete Syntax Tree nodes
 */

import type { AstNode, CstNode, LeafCstNode } from "langium";

/**
 * Walk backwards from `fromIndex` collecting `//` comments.
 * Stops at the first non-comment node, and at a blank line between
 * two comment groups.
 */
function collectCommentsBackward(
  children: readonly CstNode[],
  fromIndex: number,
): string[] {
  const comments: string[] = [];

  // nextCommentLine tracks the start line of the most recently collected
  // comment (the one closest to the node). We use it to detect blank lines
  // between comment groups: if the gap between two adjacent SL_COMMENTs is
  // more than 1 line, there is a blank line between them and we stop.
  let nextCommentLine: number | undefined;

  for (let i = fromIndex - 1; i >= 0; i--) {
    const sibling = children[i] as LeafCstNode | { tokenType: undefined };
    if (!("tokenType" in sibling) || sibling.tokenType === undefined) {
      // Composite node (another declaration, or an annotation) — stop
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

  return comments;
}

/**
 * Extract description from comments preceding an AST node.
 * Stops at a blank line between comment blocks.
 */
export function extractDescription(node: AstNode): string | undefined {
  const cstNode = node.$cstNode;
  if (!cstNode?.container) return undefined;

  const children = cstNode.container.content;
  const comments = collectCommentsBackward(children, children.indexOf(cstNode));

  return comments.length > 0 ? comments.join("\n") : undefined;
}

/**
 * Extract the description of a declaration that may carry annotations.
 *
 * Comments written *between* the annotations and the declaration keyword sit
 * inside the declaration's own CST rather than beside it, so
 * `extractDescription` cannot see them. Look inside first, then fall back to
 * the preceding siblings.
 */
export function extractLeadingDescription(node: AstNode): string | undefined {
  const cstNode = node.$cstNode;
  if (!cstNode) return undefined;

  const own = cstNode.content;
  if (own && own.length > 0) {
    // The first non-comment leaf is the declaration keyword; anything before
    // it is either an annotation (composite, stops the walk) or a comment.
    const keywordIndex = own.findIndex((child) => {
      const leaf = child as LeafCstNode | { tokenType: undefined };
      return (
        "tokenType" in leaf &&
        leaf.tokenType !== undefined &&
        leaf.tokenType.name !== "SL_COMMENT"
      );
    });
    if (keywordIndex > 0) {
      const inner = collectCommentsBackward(own, keywordIndex);
      if (inner.length > 0) return inner.join("\n");
    }
  }

  return extractDescription(node);
}
