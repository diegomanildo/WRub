const service = require("../services/project.service");

function getProjects(req, res, next) {
  try {
    const projects = service.getProjects();

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
}

function getProject(req, res, next) {
  try {
    const project = service.getProject(req.params.id);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
}

function createProject(req, res, next) {
  try {
    const { name, description } = req.body;

    const project = service.createProject(name, description);

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
}

function updateProject(req, res, next) {
  try {
    const { name, description, content } = req.body;

    const project = service.updateProject(req.params.id, name, description, content);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
}

function deleteProject(req, res, next) {
  try {
    service.deleteProject(req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
