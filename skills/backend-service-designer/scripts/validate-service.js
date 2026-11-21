#!/usr/bin/env node
/**
 * Validate a backend service against enterprise architectural and ES6 standards.
 * Usage:
 *   node scripts/validate-service.js [service-directory]
 */

import fs from "fs";
import path from "path";

const targetDir = path.resolve(process.cwd(), process.argv[2] || ".");
console.log(`\n🔍 Validating backend service architecture at: ${targetDir}\n`);

let passed = 0;
let failed = 0;
let warnings = 0;

function report(status, title, details = "") {
    if (status === "PASS") {
        passed++;
        console.log(`  ✅ [PASS] ${title}`);
    } else if (status === "WARN") {
        warnings++;
        console.log(`  ⚠️  [WARN] ${title}${details ? ` -> ${details}` : ""}`);
    } else {
        failed++;
        console.log(`  ❌ [FAIL] ${title}${details ? ` -> ${details}` : ""}`);
    }
}

// 1. Check package.json
const pkgPath = path.join(targetDir, "package.json");
if (fs.existsSync(pkgPath)) {
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.type === "module") {
            report("PASS", "package.json specifies 'type': 'module'");
        } else {
            report("FAIL", "package.json missing 'type': 'module' (CommonJS detected)");
        }
    } catch (e) {
        report("FAIL", "package.json invalid JSON", e.message);
    }
} else {
    report("FAIL", "package.json not found");
}

// 2. Check Required Directories
const requiredDirs = [
    "src/config",
    "src/database",
    "src/database/models",
    "src/setup",
    "src/controllers",
    "src/services",
    "src/routes",
    "src/swagger",
    "src/middleware",
    "src/errors",
    "src/utils",
];

for (const dir of requiredDirs) {
    if (fs.existsSync(path.join(targetDir, dir))) {
        report("PASS", `Directory exists: ${dir}`);
    } else {
        report("FAIL", `Missing required directory: ${dir}`);
    }
}

// 3. Check Key Architectural Files
const keyFiles = [
    "src/app.js",
    "src/config/env.js",
    "src/config/app-config.js",
    "src/database/connect.js",
    "src/setup/setup-app.js",
    "src/setup/setup-middlewares.js",
    "src/setup/setup-routes.js",
    "src/errors/api-error.js",
    "src/errors/catch-error.js",
    "src/utils/api-response.js",
    "src/swagger/index.js",
];

for (const file of keyFiles) {
    const fullPath = path.join(targetDir, file);
    if (fs.existsSync(fullPath)) {
        report("PASS", `Key file exists: ${file}`);
    } else {
        report("FAIL", `Missing key file: ${file}`);
    }
}

// 4. Check Database Models Naming & Exports
const modelsDir = path.join(targetDir, "src/database/models");
if (fs.existsSync(modelsDir)) {
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith(".js"));
    let invalidNames = [];
    let nonNamedExports = [];

    for (const f of modelFiles) {
        if (!f.endsWith(".model.js") || f !== f.toLowerCase()) {
            invalidNames.push(`${f} (must be lowercase and end with .model.js)`);
        }
        const fileContent = fs.readFileSync(path.join(modelsDir, f), "utf8");
        if (!/\bexport\s+(const|class|let)\s+[A-Z]/.test(fileContent) && !/\bexport\s*\{[^}]*[A-Z]/.test(fileContent)) {
            nonNamedExports.push(`${f} (missing named model export e.g. { Model })`);
        }
    }

    if (invalidNames.length === 0) {
        report("PASS", "Database models follow lowercase <name>.model.js naming");
    } else {
        report("FAIL", "Invalid database model filenames", invalidNames.join("; "));
    }

    if (nonNamedExports.length === 0) {
        report("PASS", "Database models provide uppercase named model exports");
    } else {
        report("WARN", "Database models missing named export", nonNamedExports.join("; "));
    }
}

// 5. Scan JavaScript Files for ES6 Compliance and Patterns
function getAllJsFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".git") {
                results = results.concat(getAllJsFiles(full));
            }
        } else if (entry.name.endsWith(".js")) {
            results.push(full);
        }
    }
    return results;
}

const jsFiles = getAllJsFiles(path.join(targetDir, "src"));
let commonJsUsages = [];
let missingExtensions = [];

for (const file of jsFiles) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(targetDir, file);

    // Check for CommonJS require()
    if (/\brequire\s*\(/.test(content)) {
        commonJsUsages.push(`${rel}: uses require()`);
    }

    // Check for module.exports
    if (/\bmodule\.exports\b/.test(content)) {
        commonJsUsages.push(`${rel}: uses module.exports`);
    }

    // Check relative imports lacking .js extension
    const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!path.extname(importPath)) {
            missingExtensions.push(`${rel} imports '${importPath}' without .js extension`);
        }
    }
}

if (commonJsUsages.length === 0) {
    report("PASS", "No CommonJS keywords (require, module.exports) in src/*.js");
} else {
    report("FAIL", "CommonJS syntax found in ES6 source files", commonJsUsages.slice(0, 3).join("; "));
}

if (missingExtensions.length === 0) {
    report("PASS", "All relative imports include explicit extensions (e.g. .js)");
} else {
    report("FAIL", "Relative imports missing .js extensions", missingExtensions.slice(0, 3).join("; "));
}

// Summary
console.log(`\n========================================`);
console.log(`Validation Results: ${passed} Passed, ${warnings} Warnings, ${failed} Failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
