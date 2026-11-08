// Validates data/libraries.js. Run with `npm run validate` (or `node scripts/validate-data.mjs`).
import { libraries, categories, frameworks, stylings, featureLabels } from "../data/libraries.js";

const errors = [];
const seen = new Set();
const required = ["id", "name", "category", "url", "description", "frameworks", "styling", "designLanguage", "features", "license", "tags", "bestFor"];

const isUrl = (v) => {
  try { return new URL(v).protocol === "https:"; } catch { return false; }
};

for (const [i, lib] of libraries.entries()) {
  const where = `#${i} (${lib.id ?? "no id"})`;
  for (const key of required) {
    if (lib[key] === undefined || lib[key] === null || lib[key] === "") errors.push(`${where}: missing "${key}"`);
  }
  if (lib.id && !/^[a-z0-9-]+$/.test(lib.id)) errors.push(`${where}: id must be lowercase kebab-case`);
  if (seen.has(lib.id)) errors.push(`${where}: duplicate id`);
  seen.add(lib.id);
  if (!(lib.category in categories)) errors.push(`${where}: unknown category "${lib.category}"`);
  if (!(lib.styling in stylings)) errors.push(`${where}: unknown styling "${lib.styling}"`);
  if (!Array.isArray(lib.frameworks) || lib.frameworks.length === 0) errors.push(`${where}: frameworks must be a non-empty array`);
  else for (const f of lib.frameworks) if (!(f in frameworks)) errors.push(`${where}: unknown framework "${f}"`);
  if (!Array.isArray(lib.features)) errors.push(`${where}: features must be an array`);
  else for (const f of lib.features) if (!(f in featureLabels)) errors.push(`${where}: unknown feature "${f}"`);
  if (!Array.isArray(lib.tags)) errors.push(`${where}: tags must be an array`);
  if (lib.url && !isUrl(lib.url)) errors.push(`${where}: url must be https`);
  if (lib.repo && !isUrl(lib.repo)) errors.push(`${where}: repo must be https`);
  if (lib.description && lib.description.length > 200) errors.push(`${where}: description over 200 chars`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s) in data/libraries.js:\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(`✓ ${libraries.length} libraries valid across ${new Set(libraries.map((l) => l.category)).size} categories.`);
