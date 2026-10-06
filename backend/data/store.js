import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(directory, "farm-data.json");
const defaultData = { users: [], uploads: [], inventory: [], expenses: [] };

export async function readStore() {
  await mkdir(directory, { recursive: true });
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch { await writeFile(file, JSON.stringify(defaultData, null, 2)); return structuredClone(defaultData); }
}

export async function updateStore(updater) {
  const data = await readStore();
  const updated = await updater(data) || data;
  await writeFile(file, JSON.stringify(updated, null, 2));
  return updated;
}
