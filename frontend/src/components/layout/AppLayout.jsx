import { createContext, useContext, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FileText, Search, X, Plus } from "lucide-react";
import { ROUTES } from "../../routes/paths";
import { createProject } from "../../services/projects";
import { useToast } from "../ui/ToastProvider";

/* El buscador vive en la topbar pero filtra en la página de proyectos. */
const SearchContext = createContext({ query: "", setQuery: () => {} });
export const useSearch = () => useContext(SearchContext);

function AppLayout() {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const isProjectsView =
    location.pathname === ROUTES.HOME || location.pathname === ROUTES.PROJECTS;

  async function handleCreate() {
    try {
      setCreating(true);
      const project = await createProject({
        name: "Proyecto sin título",
        description: "",
      });
      navigate(ROUTES.PROJECT(project.id));
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear el proyecto");
    } finally {
      setCreating(false);
    }
  }

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      <div className="app-shell">
        <header className="topbar">
          <a
            className="topbar-brand"
            href={ROUTES.PROJECTS}
            onClick={(e) => {
              e.preventDefault();
              navigate(ROUTES.PROJECTS);
            }}
          >
            <span className="topbar-logo">
              <FileText size={20} strokeWidth={2} />
            </span>
            <span className="topbar-name">WRub</span>
          </a>

          <button
            type="button"
            className="btn-create"
            onClick={handleCreate}
            disabled={creating}
          >
            <Plus size={20} />
            {creating ? "Creando..." : "Nuevo"}
          </button>

          {isProjectsView && (
            <div className="search-field">
              <Search size={19} />
              <input
                type="search"
                value={query}
                placeholder="Buscar en tus proyectos"
                aria-label="Buscar proyectos"
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          )}
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </SearchContext.Provider>
  );
}

export default AppLayout;
