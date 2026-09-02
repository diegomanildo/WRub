import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import Projects from "../pages/Projects";
import Project from "../pages/Project";
import SharedProject from "../pages/SharedProject";

import { ROUTES } from "./paths";

function AppRoutes() {
  return (
    <Routes>
      {/* Fuera de AppLayout a propósito: la vista de "compartir" es
          standalone, sin topbar ni buscador de "Mis proyectos". */}
      <Route path="/compartir/:token" element={<SharedProject />} />

      <Route element={<AppLayout />}>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.PROJECTS} replace />} />
        <Route path={ROUTES.PROJECTS} element={<Projects />} />
        <Route path="/proyectos/:id" element={<Project />} />
        <Route path="*" element={<Navigate to={ROUTES.PROJECTS} replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
