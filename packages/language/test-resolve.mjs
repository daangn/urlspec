import { parseFile, resolve } from "./dist/index.mjs";

const doc = await parseFile("../../examples/example.urlspec");
const resolved = resolve(doc);

console.log("Namespace:", resolved.namespace);
console.log("Namespace Description:", resolved.namespaceDescription);
console.log("\nPages:");
for (const page of resolved.pages) {
  console.log(`  ${page.name}:`, page.description);
  console.log(`    Path:`, page.path);
  for (const param of page.parameters) {
    console.log(
      `    - ${param.name} (${param.source}):`,
      JSON.stringify(param.type),
      param.description ? `// ${param.description}` : "",
    );
  }
}
console.log("\nParam Types:");
for (const pt of resolved.paramTypes) {
  console.log(`  ${pt.name}:`, pt.description);
}
