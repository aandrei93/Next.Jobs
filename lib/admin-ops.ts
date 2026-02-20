import path from "node:path";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import AdmZip from "adm-zip";

export function resolveSqliteDbPath() {
  const raw = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (!raw.startsWith("file:")) {
    throw new Error("Only sqlite file: DATABASE_URL is supported for backup operations.");
  }

  const sqlitePath = raw.slice(5);
  const normalized = sqlitePath.replace(/^\/+/, "");
  if (path.isAbsolute(normalized)) {
    return normalized;
  }

  const direct = path.resolve(process.cwd(), normalized);
  if (existsSync(direct)) {
    return direct;
  }

  const prefixedWithPrisma = path.resolve(
    process.cwd(),
    "prisma",
    normalized.replace(/^\.\//, "")
  );
  if (existsSync(prefixedWithPrisma)) {
    return prefixedWithPrisma;
  }

  const fallbackLegacy = path.resolve(process.cwd(), "prisma", "prisma", "dev.db");
  if (existsSync(fallbackLegacy)) {
    return fallbackLegacy;
  }

  return direct;
}

export async function buildBackupZipBuffer(includeUploads: boolean) {
  const dbPath = resolveSqliteDbPath();
  if (!existsSync(dbPath)) {
    throw new Error(`Database file was not found at ${dbPath}`);
  }

  const zip = new AdmZip();
  const timestamp = new Date().toISOString();
  const dbBuffer = await readFile(dbPath);
  zip.addFile("backup/dev.db", dbBuffer);
  zip.addFile(
    "backup/manifest.json",
    Buffer.from(
      JSON.stringify(
        {
          createdAt: timestamp,
          app: "next-jobs",
          includeUploads,
        },
        null,
        2
      ),
      "utf8"
    )
  );

  if (includeUploads) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (existsSync(uploadsDir)) {
      zip.addLocalFolder(uploadsDir, "backup/uploads");
    }
  }

  const fileStamp = timestamp.replace(/[:.]/g, "-");
  return {
    fileName: `nextjobs-backup-${fileStamp}.zip`,
    buffer: zip.toBuffer(),
  };
}

export async function restoreFromBackupZip(buffer: Buffer, replaceUploads: boolean) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const dbEntry = entries.find((entry) => !entry.isDirectory && entry.entryName.endsWith("/dev.db"));
  if (!dbEntry) {
    throw new Error("Backup archive is invalid: missing backup/dev.db");
  }

  const dbPath = resolveSqliteDbPath();
  const dbDir = path.dirname(dbPath);
  await mkdir(dbDir, { recursive: true });

  const tempDbPath = path.join(dbDir, `restore-${Date.now()}.db`);
  await writeFile(tempDbPath, dbEntry.getData());
  await rm(dbPath, { force: true });
  await writeFile(dbPath, await readFile(tempDbPath));
  await rm(tempDbPath, { force: true });

  let restoredUploads = 0;
  if (replaceUploads) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await rm(uploadsDir, { recursive: true, force: true });
    await mkdir(uploadsDir, { recursive: true });

    const uploadEntries = entries.filter((entry) => entry.entryName.startsWith("backup/uploads/") && !entry.isDirectory);
    for (const entry of uploadEntries) {
      const relative = entry.entryName.replace(/^backup\/uploads\//, "");
      const target = path.join(uploadsDir, relative);
      const targetDir = path.dirname(target);
      await mkdir(targetDir, { recursive: true });
      await writeFile(target, entry.getData());
      restoredUploads += 1;
    }
  }

  return { restoredUploads };
}

export async function countBackupArchives() {
  const backupsDir = path.join(process.cwd(), "backups");
  if (!existsSync(backupsDir)) {
    return 0;
  }

  const items = await readdir(backupsDir);
  return items.filter((name) => name.toLowerCase().endsWith(".zip") || name.toLowerCase().endsWith(".db")).length;
}
