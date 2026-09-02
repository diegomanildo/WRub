const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databasePath = process.env.DATABASE_PATH;

if (!databasePath) {
  throw new Error("DATABASE_PATH no está definida en el archivo .env");
}

const directory = path.dirname(databasePath);

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
}

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

// Migraciones: agregan columnas si la tabla ya existía sin ellas
const columns = db.prepare("PRAGMA table_info(projects)").all();
const columnNames = columns.map((col) => col.name);

if (!columnNames.includes("content")) {
  db.exec(`ALTER TABLE projects ADD COLUMN content TEXT;`);
}

// share_token: identificador random para el link de solo lectura. Es
// distinto del id (secuencial y adivinable) a propósito, para que compartir
// un proyecto no exponga el resto por fuerza bruta de ids consecutivos.
if (!columnNames.includes("share_token")) {
  db.exec(`ALTER TABLE projects ADD COLUMN share_token TEXT;`);
}

// share_enabled: compartir es opt-in explícito. Tener un share_token
// generado no alcanza para que /api/share/:token responda — hay que poder
// desactivar el link sin perder/regenerar el token.
if (!columnNames.includes("share_enabled")) {
  db.exec(`ALTER TABLE projects ADD COLUMN share_enabled INTEGER NOT NULL DEFAULT 0;`);
}

db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_share_token
    ON projects (share_token)
    WHERE share_token IS NOT NULL;
`);

module.exports = db;
