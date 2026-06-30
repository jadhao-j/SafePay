const fs = require("fs");
let content = fs.readFileSync("src/lib/blockchain-api.ts", "utf8");

content = content.replace(/\\`/g, "`").replace(/\\\$/g, "$");

fs.writeFileSync("src/lib/blockchain-api.ts", content);
console.log("Fixed. Sample line:", content.split("\n").find(l => l.includes("Authorization")));
