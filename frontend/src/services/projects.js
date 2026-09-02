import { api } from "./api";

export function getProjects() {
  return api.get("/projects");
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

export function getSharedProject(token) {
  return api.get(`/share/${token}`);
}
