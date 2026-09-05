const repository = require("../repositories/project.repository");
const uploads = require("./uploads.service");
const search = require("./search.service");

// Cada cuánto, como mucho, se guarda un snapshot del documento. El
// autoguardado dispara un update cada pocos segundos de escritura: sin este
// espaciado el historial serían cientos de versiones casi idénticas por
// sesión.
const VERSION_INTERVAL_MS = 5 * 60 * 1000;

// Techo de versiones por proyecto. Es una red de seguridad para recuperar
// trabajo reciente, no un archivo histórico.
const MAX_VERSIONS = 50;

function getProjects() {
  return repository.findAllSummary().map(toSummary);
}

// El listado no lleva el documento entero, pero las tarjetas muestran un
// extracto: se manda ya convertido a texto plano y recortado, en vez de
// HTML para que lo procese el navegador de cada visita.
function toSummary(row) {
  const { content_head: head, ...project } = row;

  return { ...project, preview: search.htmlToText(head).slice(0, 400) };
}

/**
 * Búsqueda full-text sobre nombre, descripción y texto del documento.
 * Devuelve los mismos objetos que getProjects (sin `content`) más un
 * `snippet` con el fragmento donde apareció lo buscado.
 */
function searchProjects(query, limit = 50) {
  const match = search.buildMatchQuery(query || "");

  if (!match) return [];

  const matches = repository.searchIds(match, limit);
  const snippets = new Map(matches.map((row) => [row.id, row.snippet]));

  // Se recorre `matches` y no el listado completo para conservar el orden
  // por relevancia que devolvió FTS5.
  return matches
    .map((row) => {
      const project = repository.findSummaryById(row.id);
      return project ? { ...toSummary(project), snippet: snippets.get(row.id) } : null;
    })
    .filter(Boolean);
}

function getProject(id) {
  const project = repository.findById(id);

  if (!project) {
    const error = new Error("Proyecto no encontrado");
    error.status = 404;
    throw error;
  }

  return project;
}

// Distinto de getProject: busca por token público, no por id, y NO
// distingue "no existe" de "existe pero share_enabled = 0" en el mensaje de
// error — de cara afuera tienen que verse igual, si no un token que se
// desactivó filtraría (por el mensaje) que el proyecto existe.
function getSharedProject(token, since) {
  const project = repository.findByShareToken(token);

  if (!project) {
    const error = new Error("Enlace no encontrado o desactivado");
    error.status = 404;
    throw error;
  }

  // La vista compartida sondea este endpoint cada pocos segundos y descarta
  // la respuesta si `updated_at` no cambió. Cuando manda el que ya tiene,
  // se responde null (204) en vez del documento entero: el contenido es el
  // HTML completo del proyecto, y mandarlo cada 4 segundos por visor para
  // que lo tiren es lo caro de esta feature.
  if (since && project.updated_at === since) {
    return null;
  }

  return project;
}

function createProject(name, description) {
  if (!name || name.trim() === "") {
    const error = new Error("El nombre es obligatorio");
    error.status = 400;
    throw error;
  }

  const project = repository.create(name.trim(), description?.trim() || null);

  search.indexProject(project);

  return project;
}

/**
 * Update parcial: `fields` puede traer name, description y/o content, y lo
 * que no venga queda como está. Antes los tres eran obligatorios de hecho,
 * así que el autoguardado tenía que reenviar el nombre para guardar texto.
 */
function updateProject(id, fields) {
  const current = getProject(id);

  const changes = {};

  if ("name" in fields) {
    if (!fields.name || fields.name.trim() === "") {
      const error = new Error("El nombre es obligatorio");
      error.status = 400;
      throw error;
    }

    changes.name = fields.name.trim();
  }

  if ("description" in fields) {
    changes.description = fields.description?.trim() || null;
  }

  if ("content" in fields) {
    changes.content = fields.content ?? null;

    // El snapshot guarda el contenido ANTERIOR, antes de pisarlo.
    if (changes.content !== current.content) {
      saveVersionIfDue(current);
    }
  }

  const project = repository.update(id, changes);

  search.indexProject(project);

  return project;
}

// Guarda una versión del estado actual salvo que ya haya una reciente (ver
// VERSION_INTERVAL_MS). Nunca lanza: perder un snapshot es preferible a que
// falle el guardado del documento, que es lo que el usuario está esperando.
function saveVersionIfDue(project) {
  try {
    const latest = repository.findLatestVersion(project.id);

    if (latest) {
      // Las fechas de SQLite son UTC sin zona ("2026-09-05 18:02:56"); sin
      // la Z el navegador las leería como hora local y el cálculo daría
      // horas de diferencia.
      const elapsed = Date.now() - new Date(`${latest.created_at}Z`).getTime();

      if (elapsed < VERSION_INTERVAL_MS) return;
    }

    repository.createVersion(project.id, project.name, project.content);
    repository.pruneVersions(project.id, MAX_VERSIONS);
  } catch (error) {
    console.error("No se pudo guardar la versión del proyecto:", error);
  }
}

function getVersions(id) {
  getProject(id);

  return repository.findVersions(id);
}

function getVersion(id, versionId) {
  getProject(id);

  const version = repository.findVersionById(id, versionId);

  if (!version) {
    const error = new Error("Versión no encontrada");
    error.status = 404;
    throw error;
  }

  return version;
}

/**
 * Vuelve el documento a una versión anterior. Antes de pisar el contenido
 * guarda el actual como una versión más (saltando el espaciado): restaurar
 * también tiene que poder deshacerse.
 */
function restoreVersion(id, versionId) {
  const current = getProject(id);
  const version = getVersion(id, versionId);

  repository.createVersion(current.id, current.name, current.content);
  repository.pruneVersions(current.id, MAX_VERSIONS);

  const project = repository.update(id, { content: version.content });

  search.indexProject(project);

  return project;
}

function deleteProject(id) {
  const project = getProject(id);

  repository.remove(id);

  repository.removeFromIndex(id);

  // Después del remove: los archivos que solo usaba este proyecto quedarían
  // huérfanos en disco para siempre. Se consultan los contenidos DESPUÉS de
  // borrarlo para que el propio proyecto no cuente como referencia.
  uploads.removeUnreferencedUploads(project.content, repository.findAllContents());
}

function enableShare(id) {
  getProject(id);

  return repository.enableShare(id);
}

function disableShare(id) {
  getProject(id);

  return repository.disableShare(id);
}

function rotateShareToken(id) {
  getProject(id);

  return repository.rotateShareToken(id);
}

module.exports = {
  getProjects,
  searchProjects,
  getProject,
  getSharedProject,
  createProject,
  updateProject,
  deleteProject,
  enableShare,
  disableShare,
  rotateShareToken,
  getVersions,
  getVersion,
  restoreVersion,
};
