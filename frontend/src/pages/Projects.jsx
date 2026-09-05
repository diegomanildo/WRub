import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FilePlus2,
  SearchX,
  LayoutGrid,
  List as ListIcon,
  ArrowDownUp,
} from "lucide-react";
import {
  getProjects,
  searchProjects,
  createProject,
  deleteProject,
} from "../services/projects";
import { ROUTES } from "../routes/paths";
import ProjectGrid from "../components/projects/ProjectGrid";
import { ProjectGridSkeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import { useSearch } from "../components/layout/AppLayout";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getUpdatedAt } from "../utils/format";

const SORTS = {
  recent: { label: "Modificado recientemente", compare: (a, b) => date(b) - date(a) },
  oldest: { label: "Modificado hace más tiempo", compare: (a, b) => date(a) - date(b) },
  name: { label: "Nombre (A-Z)", compare: (a, b) => a.name.localeCompare(b.name, "es") },
  nameDesc: { label: "Nombre (Z-A)", compare: (a, b) => b.name.localeCompare(a.name, "es") },
};

const SORT_ORDER = ["recent", "oldest", "name", "nameDesc"];

function date(project) {
  return getUpdatedAt(project)?.getTime() ?? 0;
}

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* modo privado o storage bloqueado: no es crítico */
  }
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Resultados de la búsqueda full-text del backend (busca también dentro
  // del texto del documento, no solo en el nombre). Se guarda junto con la
  // consulta que los produjo: así "¿estos resultados son de lo que hay
  // escrito ahora?" se deriva del render y el efecto no tiene que limpiar
  // el estado en cuanto cambia el texto.
  const [results, setResults] = useState(null);

  const [view, setView] = useState(() => readStored("wrub:view", "grid"));
  const [sort, setSort] = useState(() => readStored("wrub:sort", "recent"));

  const navigate = useNavigate();
  const toast = useToast();
  const { query } = useSearch();

  useDocumentTitle("Mis proyectos");

  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) toast.error("No se pudieron cargar los proyectos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Búsqueda en el backend, con un respiro entre tecla y tecla para no
  // disparar una consulta por carácter. El filtro local de antes solo veía
  // el nombre y la descripción; el contenido del documento ya no viaja en
  // el listado, así que buscar adentro tiene que hacerlo el servidor.
  useEffect(() => {
    const q = query.trim();

    if (q === "") return;

    let cancelled = false;

    const timeout = setTimeout(() => {
      searchProjects(q)
        .then((data) => {
          if (!cancelled) setResults({ query: q, items: data });
        })
        .catch((error) => {
          console.error(error);
          if (!cancelled) setResults({ query: q, items: [] });
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery !== "";

  // Los resultados sirven solo si son de lo que está escrito ahora: si no,
  // todavía se está buscando (o se cambió el texto y los viejos ya no
  // corresponden).
  const searchResults =
    isSearching && results?.query === trimmedQuery ? results.items : null;

  const searching = isSearching && searchResults === null;

  const visibleProjects = useMemo(() => {
    // Los resultados vienen ordenados por relevancia: reordenarlos por
    // fecha o nombre tiraría eso a la basura, así que el criterio de orden
    // solo aplica al listado completo.
    if (searchResults) return searchResults;

    return [...projects].sort(SORTS[sort]?.compare ?? SORTS.recent.compare);
  }, [projects, searchResults, sort]);

  function changeView(next) {
    setView(next);
    store("wrub:view", next);
  }

  function cycleSort() {
    const next = SORT_ORDER[(SORT_ORDER.indexOf(sort) + 1) % SORT_ORDER.length];
    setSort(next);
    store("wrub:sort", next);
  }

  async function handleNewProject() {
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
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    const target = projectToDelete;
    try {
      setDeleting(true);
      await deleteProject(target.id);
      setProjects((prev) => prev.filter((p) => p.id !== target.id));
      setProjectToDelete(null);
      toast.success(`"${target.name}" se eliminó`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el proyecto");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">
        {isSearching ? "Resultados de la búsqueda" : "Mis proyectos"}
      </h1>

      <div className="toolbar-row">
        {!isSearching && (
          <button type="button" className="chip-select" onClick={cycleSort}>
            <ArrowDownUp size={15} />
            {SORTS[sort]?.label ?? SORTS.recent.label}
          </button>
        )}

        {isSearching && (
          <span className="result-count">
            {searching ? "Buscando..." : "Por relevancia"}
          </span>
        )}

        {!loading && !searching && (
          <span className="result-count">
            {visibleProjects.length === 0
              ? "Sin resultados"
              : `${visibleProjects.length} proyecto${
                  visibleProjects.length === 1 ? "" : "s"
                }`}
          </span>
        )}

        <div className="toolbar-spacer" />

        <div className="view-toggle" role="group" aria-label="Cambiar vista">
          <button
            type="button"
            className={view === "grid" ? "is-active" : ""}
            aria-pressed={view === "grid"}
            aria-label="Vista de cuadrícula"
            onClick={() => changeView("grid")}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            aria-pressed={view === "list"}
            aria-label="Vista de lista"
            onClick={() => changeView("list")}
          >
            <ListIcon size={17} />
          </button>
        </div>
      </div>

      {loading || searching ? (
        <ProjectGridSkeleton />
      ) : visibleProjects.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            {isSearching ? <SearchX size={34} strokeWidth={1.5} /> : <FilePlus2 size={34} strokeWidth={1.5} />}
          </span>

          {isSearching ? (
            <>
              <p className="empty-state-title">Nada coincide con "{query}"</p>
              <p className="empty-state-text">
                Se busca en el nombre, la descripción y el texto de los
                documentos. Probá con otra palabra o revisá la ortografía.
              </p>
            </>
          ) : (
            <>
              <p className="empty-state-title">Todavía no tenés proyectos</p>
              <p className="empty-state-text">
                Creá tu primer documento y empezá a escribir. Después vas a poder
                exportarlo a PDF.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNewProject}
                disabled={creating}
              >
                <Plus size={18} />
                {creating ? "Creando..." : "Nuevo proyecto"}
              </button>
            </>
          )}
        </div>
      ) : (
        <ProjectGrid
          projects={visibleProjects}
          view={view}
          onDeleteClick={setProjectToDelete}
        />
      )}

      {projectToDelete && (
        <div
          className="modal-backdrop-custom"
          onClick={() => !deleting && setProjectToDelete(null)}
        >
          <div
            className="modal-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title" id="confirm-title">
              ¿Eliminar proyecto?
            </h2>
            <p className="modal-text">
              Vas a eliminar <strong>{projectToDelete.name}</strong>. Esta acción
              no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
