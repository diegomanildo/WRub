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

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
