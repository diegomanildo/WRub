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

// Necesario para que el ON DELETE CASCADE de project_versions funcione:
// SQLite trae las foreign keys desactivadas por default.
db.pragma("foreign_keys = ON");

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

// Historial de versiones: cada snapshot guarda el contenido ANTERIOR del
// documento, para poder volver atrás. Tabla aparte y no columnas extra
// porque son N filas por proyecto. El CASCADE evita dejar versiones
// huérfanas cuando se borra el proyecto.
db.exec(`
    CREATE TABLE IF NOT EXISTS project_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        content TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_project_versions_project
    ON project_versions (project_id, created_at DESC);
`);

// Índice de búsqueda full-text. Es una tabla FTS5 independiente (no
// `content=` apuntando a projects) a propósito: lo que se indexa no es el
// HTML crudo de la columna `content` sino su texto plano, calculado en JS
// (ver search.service.js). Con una tabla externa habría que indexar el HTML
// tal cual y buscar "p" o "div" traería todos los documentos.
//
// El rowid del índice es el id del proyecto, así el JOIN es directo.
db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
        name,
        description,
        content,
        tokenize = "unicode61 remove_diacritics 2"
    );
`);

module.exports = db;
