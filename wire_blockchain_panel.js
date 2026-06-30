const fs = require("fs");
const path = "src/app/admin/cases/[id]/page.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Add import
const oldImport = `import ExplanationPanel from "@/components/user/ExplanationPanel";`;
const newImport = `import ExplanationPanel from "@/components/user/ExplanationPanel";
import BlockchainPanel from "@/components/admin/BlockchainPanel";`;
if (!content.includes(oldImport)) {
  console.log("IMPORT ANCHOR NOT FOUND");
  process.exit(1);
}
content = content.replace(oldImport, newImport);

// 2. Render panel below the explanation panel, remove the now-redundant static hint
const oldBlock = `                {explanation ? (
                  <ExplanationPanel data={explanation} />
                ) : (
                  <div
                    style={{
                      background: "#0A1628",
                      border: "1px dashed #162840",
                      borderRadius: "12px",
                      padding: "48px",
                      textAlign: "center",
                      color: "#3D6080",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔍</div>
                    No SHAP explanation available for this transaction.
                  </div>
                )}`;

const newBlock = `                {explanation ? (
                  <ExplanationPanel data={explanation} />
                ) : (
                  <div
                    style={{
                      background: "#0A1628",
                      border: "1px dashed #162840",
                      borderRadius: "12px",
                      padding: "48px",
                      textAlign: "center",
                      color: "#3D6080",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔍</div>
                    No SHAP explanation available for this transaction.
                  </div>
                )}

                <BlockchainPanel caseData={caseData} />`;

if (!content.includes(oldBlock)) {
  console.log("RENDER ANCHOR NOT FOUND");
  process.exit(1);
}
content = content.replace(oldBlock, newBlock);

// 3. Remove the now-redundant static "confirmed fraud" hint text block
const oldHint = `                  {/* Confirmed fraud → publish hint */}
                  {selectedStatus === "confirmed_fraud" && (
                    <div
                      style={{
                        marginTop: "14px",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        fontSize: "12px",
                        color: "#EF4444",
                        lineHeight: "1.5",
                      }}
                    >
                      ⛓ After saving, consider publishing an anonymized fraud signal to the blockchain ledger via <strong>/blockchain/fraud-signal/publish</strong> (Phase 6).
                    </div>
                  )}`;

if (content.includes(oldHint)) {
  content = content.replace(oldHint, "");
  console.log("Removed static hint block.");
} else {
  console.log("Static hint block not found (may already be removed) - skipping.");
}

fs.writeFileSync(path, content);
console.log("SUCCESS - import added:", content.includes("BlockchainPanel"));
console.log("SUCCESS - panel rendered:", content.includes("<BlockchainPanel caseData={caseData} />"));
