export const ROUTES = {
  HOME: "/",
  PROJECTS: "/proyectos",
  PROJECT: (id) => `/proyectos/${id}`,
  SHARED: (token) => `/compartir/${token}`,
};
