import { api } from "./api";

export function getProjects() {
  return api.get("/projects");
}

/**
 * Búsqueda full-text en el backend: además del nombre y la descripción mira
 * dentro del texto del documento. Cada resultado trae un `snippet` con el
 * fragmento donde apareció lo buscado (con <mark> alrededor).
 */
export function searchProjects(query) {
  return api.get(`/projects?search=${encodeURIComponent(query)}`);
}

export function getProject(id) {
  return api.get(`/projects/${id}`);
}

export function createProject(data) {
  return api.post("/projects", data);
}

export function updateProject(id, data) {
  return api.patch(`/projects/${id}`, data);
}

export function deleteProject(id) {
  return api.delete(`/projects/${id}`);
}

export function enableShare(id) {
  return api.post(`/projects/${id}/share`);
}

export function disableShare(id) {
  return api.delete(`/projects/${id}/share`);
}

export function rotateShare(id) {
  return api.post(`/projects/${id}/share/rotate`);
}

/**
 * `since` = el `updated_at` que ya tiene el cliente. Si el documento no
 * cambió, el backend responde 204 y esta función devuelve null en vez del
 * documento entero (lo usa el sondeo de la vista compartida).
 */
/* ===== Historial de versiones ===== */

export function getVersions(projectId) {
  return api.get(`/projects/${projectId}/versions`);
}

export function getVersion(projectId, versionId) {
  return api.get(`/projects/${projectId}/versions/${versionId}`);
}

export function restoreVersion(projectId, versionId) {
  return api.post(`/projects/${projectId}/versions/${versionId}/restore`);
}

export function getSharedProject(token, since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";

  return api.get(`/share/${token}${query}`);
}
