import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

function parseItems(raw) {
  if (!raw) {
    return ["TBD"];
  }

  const items = raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : ["TBD"];
}

function parseVersion(version) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpPatch(version) {
  const parsed = parseVersion(version);
  if (!parsed) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  return `v${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

function getCurrentVersionFromFile(filePath, versionConstName) {
  const source = fs.readFileSync(filePath, "utf8");
  const regex = new RegExp(`export const ${versionConstName} = "(v[^"]+)";`);
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Cannot find ${versionConstName} in ${filePath}`);
  }
  return match[1];
}

let nextVersionArg = args[0];
let shift = 0;

if (!nextVersionArg || nextVersionArg === "auto") {
  shift = nextVersionArg ? 1 : 0;
  nextVersionArg = null;
} else if (!/^v\d+\.\d+\.\d+$/.test(nextVersionArg)) {
  shift = 0;
  nextVersionArg = null;
}

const titleRo = args[0 + shift] || "Frontend updates";
const titleEn = args[1 + shift] || "Frontend updates";
const itemsRo = parseItems(args[2 + shift]);
const itemsEn = parseItems(args[3 + shift]);

const frontendFilePath = path.join(process.cwd(), "lib", "frontend-changelog.ts");
const currentFrontendVersion = getCurrentVersionFromFile(frontendFilePath, "FRONTEND_VERSION");
const nextVersion = nextVersionArg || bumpPatch(currentFrontendVersion);

if (!parseVersion(nextVersion)) {
  console.error("Usage: node scripts/bump-frontend-version.mjs [vX.Y.Z|auto] \"Titlu RO\" \"Title EN\" \"item1|item2\" \"item1|item2\"");
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);

function escapeValue(value) {
  return JSON.stringify(String(value)).slice(1, -1);
}

function stringifyItems(items) {
  return items.map((item) => `      "${escapeValue(item)}",`).join("\n");
}

function prependEntry({
  filePath,
  versionConstName,
  arrayName,
  nextVersionValue,
  entry,
}) {
  let source = fs.readFileSync(filePath, "utf8");

  if (source.includes(`version: "${nextVersionValue}"`)) {
    throw new Error(`Version ${nextVersionValue} already exists in ${filePath}`);
  }

  const versionRegex = new RegExp(`export const ${versionConstName} = "v[^"]+";`);
  source = source.replace(versionRegex, `export const ${versionConstName} = "${nextVersionValue}";`);

  const arrayNeedle = `export const ${arrayName}: `;
  const startIndex = source.indexOf(arrayNeedle);
  if (startIndex === -1) {
    throw new Error(`Cannot find array ${arrayName} in ${filePath}`);
  }

  const assignToken = "= [";
  const assignIndex = source.indexOf(assignToken, startIndex);
  if (assignIndex === -1) {
    throw new Error(`Cannot find assignment token '= [' for ${arrayName} in ${filePath}`);
  }

  const bracketIndex = assignIndex + assignToken.length - 1;
  if (bracketIndex === -1) {
    throw new Error(`Cannot find array start [ for ${arrayName} in ${filePath}`);
  }

  const insertAt = bracketIndex + 1;
  source = `${source.slice(0, insertAt)}\n${entry}${source.slice(insertAt)}`;
  fs.writeFileSync(filePath, source, "utf8");
}

const frontendEntry = `  {
    version: "${nextVersion}",
    date: "${date}",
    titleRo: "${escapeValue(titleRo)}",
    titleEn: "${escapeValue(titleEn)}",
    itemsRo: [
${stringifyItems(itemsRo)}
    ],
    itemsEn: [
${stringifyItems(itemsEn)}
    ],
  },
`;

prependEntry({
  filePath: frontendFilePath,
  versionConstName: "FRONTEND_VERSION",
  arrayName: "frontendChangelog",
  nextVersionValue: nextVersion,
  entry: frontendEntry,
});

const adminVersion = `${nextVersion}-admin`;
const adminEntry = `  {
    version: "${adminVersion}",
    date: "${date}",
    titleRo: "${escapeValue(titleRo)} (Admin)",
    titleEn: "${escapeValue(titleEn)} (Admin)",
    itemsRo: [
${stringifyItems(itemsRo)}
    ],
    itemsEn: [
${stringifyItems(itemsEn)}
    ],
  },
`;

prependEntry({
  filePath: path.join(process.cwd(), "lib", "admin-changelog.ts"),
  versionConstName: "ADMIN_CHANGELOG_VERSION",
  arrayName: "adminChangelog",
  nextVersionValue: adminVersion,
  entry: adminEntry,
});

console.log(`Updated frontend/admin versions and inserted release templates for ${nextVersion}.`);
