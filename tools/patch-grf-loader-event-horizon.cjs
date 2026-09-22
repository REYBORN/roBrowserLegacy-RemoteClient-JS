#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const distDirectory = path.join(
  __dirname,
  "..",
  "node_modules",
  "@chicowall",
  "grf-loader",
  "dist"
);
const bundles = ["index.cjs", "index.js", "index.global.js"];
const alreadyPatched = '.startsWith("Event Horizon")';
const signatureGuard = /if\(([$A-Z_a-z][$\w]*)!==([$A-Z_a-z][$\w]*)(?:&&\1!=="Event Horizon")?\)throw new ([^(]+)\("INVALID_MAGIC","Not a GRF file \(invalid signature\)"/;

for (const bundle of bundles) {
  const bundlePath = path.join(distDirectory, bundle);
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Missing @chicowall/grf-loader bundle: ${bundlePath}`);
  }

  const source = fs.readFileSync(bundlePath, "utf8");
  if (source.includes(alreadyPatched)) {
    continue;
  }

  const match = source.match(signatureGuard);
  if (!match) {
    throw new Error(`Could not locate the GRF signature guard in ${bundlePath}`);
  }

  const [guard, signatureVariable, legacySignatureVariable, errorConstructor] = match;
  const replacement = guard.replace(
    `if(${signatureVariable}!==${legacySignatureVariable}`,
    `if(${signatureVariable}!==${legacySignatureVariable}&&!${signatureVariable}.startsWith("Event Horizon")`
  );

  fs.writeFileSync(bundlePath, source.replace(guard, replacement), "utf8");
  console.log(`Patched Event Horizon GRF support in ${bundle}`);
}
