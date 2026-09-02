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
                updated_at
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
                updated_at
            FROM projects
            WHERE id = ?
        `,
    )
    .get(id);
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

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};