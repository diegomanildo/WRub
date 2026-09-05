const crypto = require("crypto");
const db = require("../config/database");

// Listado de "Mis proyectos": sin `content` a propósito. La lista solo
// muestra nombre, descripción y fecha, pero el HTML de cada documento puede
// pesar megas — traerlo acá significaba bajar todos los documentos enteros
// para pintar unas tarjetas.
function findAllSummary() {
  return db
    .prepare(
      `
            SELECT
                id,
                name,
                description,
                -- Solo el arranque del documento: las tarjetas muestran un
                -- extracto corto, y con substr el HTML completo no sale de
                -- la base (el service lo pasa a texto plano).
                substr(content, 1, 2000) AS content_head,
                created_at,
                updated_at,
                share_token,
                share_enabled
            FROM projects
            ORDER BY updated_at DESC
        `,
    )
    .all();
}

// Solo los contenidos, para la limpieza de archivos subidos al borrar un
// proyecto (ver uploads.service.js), que es el único caso donde hacen falta
// todos juntos.
function findAllContents() {
  return db
    .prepare(`SELECT content FROM projects`)
    .all()
    .map((row) => row.content);
}

function findById(id) {
  return db
    .prepare(
      `
            SELECT
                id,
                name,
                description,
                content,
                created_at,
                updated_at,
                share_token,
                share_enabled
            FROM projects
            WHERE id = ?
        `,
    )
    .get(id);
}

// Igual que findAllSummary pero de a uno: lo usa la búsqueda, que arma su
// lista de resultados a partir de los ids que devuelve el índice.
function findSummaryById(id) {
  return db
    .prepare(
      `
            SELECT
                id,
                name,
                description,
                -- Solo el arranque del documento: las tarjetas muestran un
                -- extracto corto, y con substr el HTML completo no sale de
                -- la base (el service lo pasa a texto plano).
                substr(content, 1, 2000) AS content_head,
                created_at,
                updated_at,
                share_token,
                share_enabled
            FROM projects
            WHERE id = ?
        `,
    )
    .get(id);
}

// Búsqueda pública por token de compartir. A propósito NO trae `id` (el
// front de solo lectura no necesita saber el id real del proyecto) y filtra
// share_enabled = 1 acá mismo, no en el service, para que no haya forma de
// llamar esto y traer un proyecto con el compartir desactivado.
function findByShareToken(token) {
  return db
    .prepare(
      `
            SELECT
                name,
                description,
                content,
                updated_at
            FROM projects
            WHERE share_token = ? AND share_enabled = 1
        `,
    )
    .get(token);
}

function create(name, description) {
  const result = db
    .prepare(
      `
            INSERT INTO projects (name, description)
            VALUES (?, ?)
        `,
    )
    .run(name, description);

  return findById(result.lastInsertRowid);
}

/**
 * Update parcial: solo pisa las columnas presentes en `fields`. Antes era
 * un UPDATE fijo de las tres columnas, así que guardar el contenido exigía
 * mandar también nombre y descripción, y omitir cualquiera de las dos las
 * ponía en null.
 */
function update(id, fields) {
  const columns = [];
  const values = [];

  for (const column of ["name", "description", "content"]) {
    if (column in fields) {
      columns.push(`${column} = ?`);
      values.push(fields[column]);
    }
  }

  if (columns.length > 0) {
    db.prepare(
      `
            UPDATE projects
            SET ${columns.join(", ")}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
    ).run(...values, id);
  }

  return findById(id);
}

function remove(id) {
  return db
    .prepare(
      `
            DELETE FROM projects
            WHERE id = ?
        `,
    )
    .run(id);
}

// Genera (si hace falta) y activa el link de compartir. Si ya había un
// token, lo reusa: así "compartir" no invalida un link que un amigo ya
// tenga guardado, salvo que se pida explícitamente rotarlo (ver
// rotateShareToken).
function enableShare(id) {
  const project = findById(id);
  const token = project.share_token || crypto.randomUUID();

  db.prepare(
    `
            UPDATE projects
            SET share_token = ?, share_enabled = 1
            WHERE id = ?
        `,
  ).run(token, id);

  return findById(id);
}

function disableShare(id) {
  db.prepare(
    `
            UPDATE projects
            SET share_enabled = 0
            WHERE id = ?
        `,
  ).run(id);

  return findById(id);
}

// Invalida el link viejo (útil si se compartió por error a quien no
// correspondía) y genera uno nuevo, manteniendo share_enabled = 1.
function rotateShareToken(id) {
  const token = crypto.randomUUID();

  db.prepare(
    `
            UPDATE projects
            SET share_token = ?, share_enabled = 1
            WHERE id = ?
        `,
  ).run(token, id);

  return findById(id);
}

/* ===== Historial de versiones ===== */

function createVersion(projectId, name, content) {
  return db
    .prepare(
      `
            INSERT INTO project_versions (project_id, name, content)
            VALUES (?, ?, ?)
        `,
    )
    .run(projectId, name, content);
}

// Sin `content`: la lista del historial solo muestra fecha y nombre, y
// traer el HTML de cada snapshot sería peor que el problema que arregla
// findAllSummary (son N versiones por proyecto).
function findVersions(projectId) {
  return db
    .prepare(
      `
            SELECT id, name, created_at
            FROM project_versions
            WHERE project_id = ?
            ORDER BY created_at DESC, id DESC
        `,
    )
    .all(projectId);
}

function findVersionById(projectId, versionId) {
  return db
    .prepare(
      `
            SELECT id, name, content, created_at
            FROM project_versions
            WHERE project_id = ? AND id = ?
        `,
    )
    .get(projectId, versionId);
}

function findLatestVersion(projectId) {
  return db
    .prepare(
      `
            SELECT id, created_at
            FROM project_versions
            WHERE project_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        `,
    )
    .get(projectId);
}

// Poda: el historial es una red de seguridad, no un archivo histórico. Sin
// esto la tabla crece sin techo con cada snapshot.
function pruneVersions(projectId, keep) {
  return db
    .prepare(
      `
            DELETE FROM project_versions
            WHERE project_id = ?
              AND id NOT IN (
                  SELECT id FROM project_versions
                  WHERE project_id = ?
                  ORDER BY created_at DESC, id DESC
                  LIMIT ?
              )
        `,
    )
    .run(projectId, projectId, keep);
}

/* ===== Índice full-text ===== */

// El rowid del índice es el id del proyecto. Se borra y se reinserta en vez
// de UPDATE porque en FTS5 es la forma recomendada de reindexar una fila.
function indexProject(id, name, description, contentText) {
  db.prepare(`DELETE FROM projects_fts WHERE rowid = ?`).run(id);

  db.prepare(
    `
            INSERT INTO projects_fts (rowid, name, description, content)
            VALUES (?, ?, ?, ?)
        `,
  ).run(id, name || "", description || "", contentText || "");
}

function removeFromIndex(id) {
  db.prepare(`DELETE FROM projects_fts WHERE rowid = ?`).run(id);
}

function countIndexed() {
  return db.prepare(`SELECT COUNT(*) AS total FROM projects_fts`).get().total;
}

/**
 * Ids de proyectos que matchean, ordenados por relevancia (`rank` de FTS5,
 * más negativo = mejor), junto con un fragmento del contenido con los
 * términos encontrados para mostrar en los resultados.
 *
 * Los términos se marcan con los caracteres de control  y , no con
 * <mark>: el fragmento es texto escrito por el usuario, así que si viniera
 * con etiquetas HTML el front tendría que insertarlo como HTML para que se
 * vea el resaltado, y de paso ejecutaría lo que hubiera escrito en el
 * documento. Con delimitadores que no existen en el texto, el front parte
 * el string y arma los <mark> como elementos de React.
 */
function searchIds(match, limit) {
  return db
    .prepare(
      `
            SELECT
                rowid AS id,
                snippet(projects_fts, 2, char(1), char(2), '…', 20) AS snippet
            FROM projects_fts
            WHERE projects_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        `,
    )
    .all(match, limit);
}

module.exports = {
  findAllSummary,
  findAllContents,
  findSummaryById,
  findById,
  findByShareToken,
  create,
  update,
  remove,
  enableShare,
  disableShare,
  rotateShareToken,
  createVersion,
  findVersions,
  findVersionById,
  findLatestVersion,
  pruneVersions,
  indexProject,
  removeFromIndex,
  countIndexed,
  searchIds,
};
