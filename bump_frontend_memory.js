const fs = require("fs");
const path = "docker-compose.yml";
let content = fs.readFileSync(path, "utf8");

const occurrences = content.split("mem_limit: 1024m").length - 1;
console.log("occurrences of 'mem_limit: 1024m':", occurrences);

// Only the frontend service block should be touched - find it precisely
// by anchoring on the frontend service's distinctive command line
const frontendAnchor = `command: ["npm", "run", "dev"]`;
const idx = content.indexOf(frontendAnchor);
if (idx === -1) {
    console.log("FRONTEND ANCHOR NOT FOUND - ABORT");
    process.exit(1);
}

// Find the next "mem_limit: 1024m" after this anchor
const memIdx = content.indexOf("mem_limit: 1024m", idx);
if (memIdx === -1) {
    console.log("MEM_LIMIT NOT FOUND AFTER FRONTEND ANCHOR - ABORT");
    process.exit(1);
}

content =
    content.slice(0, memIdx) +
    "mem_limit: 2048m" +
    content.slice(memIdx + "mem_limit: 1024m".length);

fs.writeFileSync(path, content);
console.log("SUCCESS - frontend mem_limit bumped to 2048m");