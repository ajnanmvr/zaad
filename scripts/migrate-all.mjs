#!/usr/bin/env node

import { spawnSync } from "child_process";
import path from "path";

const rootDir = process.cwd();

const steps = [
  {
    name: "Entities, documents, and credentials",
    script: path.join(rootDir, "scripts", "migrate-legacy-schema-to-entities.mjs"),
  },
  {
    name: "Users to super-admin",
    script: path.join(rootDir, "scripts", "migrate-legacy-users-to-superadmin.mjs"),
  },
  {
    name: "Invoices",
    script: path.join(rootDir, "scripts", "migrate-legacy-invoices.mjs"),
  },
  {
    name: "Records",
    script: path.join(rootDir, "scripts", "migrate-legacy-records.mjs"),
  },
];

function runStep(step, index, total) {
  console.log(`\n[${index}/${total}] ${step.name}`);
  console.log(`Running: node ${step.script}`);

  const result = spawnSync(process.execPath, [step.script], {
    stdio: "inherit",
    cwd: rootDir,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Step failed (${step.name}) with exit code ${result.status}`);
  }
}

function main() {
  const total = steps.length;

  for (let i = 0; i < total; i += 1) {
    runStep(steps[i], i + 1, total);
  }

  console.log("\nAll migration scripts completed successfully.");
}

try {
  main();
} catch (error) {
  console.error("\nMigration runner failed:", error);
  process.exitCode = 1;
}
