const fs = require("fs");
const path = "src/app/admin/cases/[id]/page.tsx";
let content = fs.readFileSync(path, "utf8");

const importLine = `import BlockchainPanel from "@/components/admin/BlockchainPanel";`;
const renderLine = `                <BlockchainPanel caseData={caseData} />`;

const importCount = content.split(importLine).length - 1;
const renderCount = content.split(renderLine).length - 1;
console.log("import occurrences before:", importCount);
console.log("render occurrences before:", renderCount);

// Replace all occurrences of the import with empty, then re-insert exactly once
content = content.split(importLine).join("");
content = content.split(renderLine).join("");

// Clean up any resulting blank lines where the import was
content = content.replace(/\n\n\n+/g, "\n\n");

// Re-insert import once, right after ExplanationPanel import
const anchorImport = `import ExplanationPanel from "@/components/user/ExplanationPanel";`;
if (!content.includes(anchorImport)) {
    console.log("IMPORT ANCHOR NOT FOUND - ABORT");
    process.exit(1);
}
content = content.replace(anchorImport, anchorImport + "\n" + importLine);

// Re-insert render once, right after the explanation ternary closing `)}`
const anchorRender = `                    No SHAP explanation available for this transaction.
                  </div>
                )}`;
if (!content.includes(anchorRender)) {
    console.log("RENDER ANCHOR NOT FOUND - ABORT");
    process.exit(1);
}
content = content.replace(anchorRender, anchorRender + "\n\n" + renderLine);

fs.writeFileSync(path, content);

const finalImportCount = content.split(importLine).length - 1;
const finalRenderCount = content.split(renderLine).length - 1;
console.log("import occurrences after:", finalImportCount);
console.log("render occurrences after:", finalRenderCount);
console.log(finalImportCount === 1 && finalRenderCount === 1 ? "SUCCESS" : "STILL WRONG - MANUAL CHECK NEEDED");