const crypto = require("crypto");
const db = require("../config/database");

function findAll() {
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
            ORDER BY updated_at DESC
        `,
    )
    .all();
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

function update(id, name, description, content) {
  db.prepare(
    `
            UPDATE projects
            SET
                name = ?,
                description = ?,
                content = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
  ).run(name, description, content, id);

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

module.exports = {
  findAll,
  findById,
  findByShareToken,
  create,
  update,
  remove,
  enableShare,
  disableShare,
  rotateShareToken,
};
