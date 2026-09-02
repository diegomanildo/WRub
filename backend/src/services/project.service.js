const repository = require("../repositories/project.repository");

function getProjects() {
  return repository.findAll();
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
function getSharedProject(token) {
  const project = repository.findByShareToken(token);

  if (!project) {
    const error = new Error("Enlace no encontrado o desactivado");
    error.status = 404;
    throw error;
  }

  return project;
}

function createProject(name, description) {
  if (!name || name.trim() === "") {
    const error = new Error("El nombre es obligatorio");
    error.status = 400;
    throw error;
  }

  return repository.create(name.trim(), description?.trim() || null);
}

function updateProject(id, name, description, content) {
  getProject(id);

  if (!name || name.trim() === "") {
    const error = new Error("El nombre es obligatorio");
    error.status = 400;
    throw error;
  }

  return repository.update(id, name.trim(), description?.trim() || null, content ?? null);
}

function deleteProject(id) {
  getProject(id);

  repository.remove(id);
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
  getProject,
  getSharedProject,
  createProject,
  updateProject,
  deleteProject,
  enableShare,
  disableShare,
  rotateShareToken,
};
