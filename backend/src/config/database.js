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

// Migración: agrega la columna 'content' si la tabla ya existía sin ella
const columns = db.prepare("PRAGMA table_info(projects)").all();
const hasContentColumn = columns.some((col) => col.name === "content");

if (!hasContentColumn) {
  db.exec(`ALTER TABLE projects ADD COLUMN content TEXT;`);
}

module.exports = db;
