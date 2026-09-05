const service = require("../services/project.service");

function getProjects(req, res, next) {
  try {
    // ?search= busca también dentro del texto del documento; sin el
    // parámetro devuelve el listado completo de siempre.
    const search = req.query.search?.trim();

    const projects = search
      ? service.searchProjects(search)
      : service.getProjects();

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

function getSharedProject(req, res, next) {
  try {
    const project = service.getSharedProject(req.params.token, req.query.since);

    // null = el cliente ya tiene esta versión (mandó ?since con el
    // `updated_at` vigente). 204 sin cuerpo; el front lo recibe como null.
    if (!project) {
      return res.status(204).send();
    }

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
    // Se pasa el body tal cual: el service actualiza solo los campos
    // presentes, así el autoguardado puede mandar únicamente `content`.
    const project = service.updateProject(req.params.id, req.body ?? {});

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

function enableShare(req, res, next) {
  try {
    const project = service.enableShare(req.params.id);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
}

function disableShare(req, res, next) {
  try {
    const project = service.disableShare(req.params.id);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
}

function rotateShare(req, res, next) {
  try {
    const project = service.rotateShareToken(req.params.id);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
}

function getVersions(req, res, next) {
  try {
    const versions = service.getVersions(req.params.id);

    res.status(200).json(versions);
  } catch (error) {
    next(error);
  }
}

function getVersion(req, res, next) {
  try {
    const version = service.getVersion(req.params.id, req.params.versionId);

    res.status(200).json(version);
  } catch (error) {
    next(error);
  }
}

function restoreVersion(req, res, next) {
  try {
    const project = service.restoreVersion(req.params.id, req.params.versionId);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
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
  rotateShare,
  getVersions,
  getVersion,
  restoreVersion,
};
