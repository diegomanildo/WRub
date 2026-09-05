const repository = require("../repositories/project.repository");

/**
 * HTML del documento a texto plano para indexar. Sin esto el índice
 * guardaría las etiquetas y buscar "p" o "div" traería todo.
 *
 * Se sacan primero los bloques <style>/<script> con su contenido (el texto
 * de adentro no es texto del documento), después las etiquetas, y al final
 * se resuelven las entidades más comunes.
 */
function htmlToText(html) {
  if (!html) return "";

  return html
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Texto libre a una expresión MATCH de FTS5.
 *
 * Cada palabra va entre comillas dobles (con las internas escapadas) para
 * que FTS5 la trate como literal: sin esto, escribir `AND`, `*` o un
 * paréntesis en el buscador es sintaxis del motor y hace fallar la query
 * entera con un error de SQL. Al último término se le agrega `*` para que
 * busque por prefijo mientras se escribe.
 */
function buildMatchQuery(query) {
  const terms = query.trim().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return null;

  return terms
    .map((term, index) => {
      const quoted = `"${term.replace(/"/g, '""')}"`;
      return index === terms.length - 1 ? `${quoted}*` : quoted;
    })
    .join(" AND ");
}

function indexProject(project) {
  repository.indexProject(
    project.id,
    project.name,
    project.description,
    htmlToText(project.content),
  );
}

/**
 * Reconstruye el índice al arrancar si está vacío pero ya hay proyectos:
 * pasa la primera vez que corre esta versión sobre una base existente, y
 * si no, buscar por contenido no encontraría nada de lo escrito hasta hoy.
 */
function reindexIfEmpty() {
  const projects = repository.findAllSummary();

  if (projects.length === 0 || repository.countIndexed() > 0) return;

  for (const summary of projects) {
    indexProject(repository.findById(summary.id));
  }

  console.log(`Índice de búsqueda reconstruido (${projects.length} proyectos)`);
}

module.exports = {
  htmlToText,
  buildMatchQuery,
  indexProject,
  reindexIfEmpty,
};
