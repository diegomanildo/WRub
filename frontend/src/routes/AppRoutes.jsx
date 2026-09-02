import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import Projects from "../pages/Projects";
import Project from "../pages/Project";

import { ROUTES } from "./paths";

function AppRoutes() {
  return (
    <Routes>
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
