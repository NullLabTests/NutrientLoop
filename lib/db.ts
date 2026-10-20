import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "documents.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    markdown TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function insertDocument(
  id: string,
  filename: string,
  markdown: string,
  metadata: Record<string, unknown> | null = null
) {
  const stmt = db.prepare(
    "INSERT INTO documents (id, filename, markdown, metadata) VALUES (?, ?, ?, ?)"
  );
  stmt.run(id, filename, markdown, metadata ? JSON.stringify(metadata) : null);
}

export function getDocument(id: string) {
  const stmt = db.prepare("SELECT * FROM documents WHERE id = ?");
  const row: any = stmt.get(id);
  if (!row) return null;
  return { ...row, metadata: row.metadata ? JSON.parse(row.metadata) : null };
}

export interface DocumentSummary {
  id: string;
  filename: string;
  created_at: string;
  page_count: number | null;
}

export function getAllDocuments(): DocumentSummary[] {
  const stmt = db.prepare(
    "SELECT id, filename, metadata, created_at FROM documents ORDER BY created_at DESC"
  );
  const rows: any[] = stmt.all();
  return rows.map((row) => {
    let page_count: number | null = null;
    if (row.metadata) {
      try {
        page_count = JSON.parse(row.metadata).pages ?? null;
      } catch {
        page_count = null;
      }
    }
    return {
      id: row.id,
      filename: row.filename,
      created_at: row.created_at,
      page_count,
    };
  });
}

export default db;
