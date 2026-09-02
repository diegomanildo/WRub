import ProjectCard from "./ProjectCard";
import ProjectRow from "./ProjectRow";

function ProjectGrid({ projects, view = "grid", onDeleteClick }) {
  if (view === "list") {
    return (
      <div className="project-list">
        <div className="list-head">
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Modificado</span>
          <span />
        </div>
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="project-grid">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
}

export default ProjectGrid;
