import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import { formatRelative, formatFull, getUpdatedAt, htmlToText } from "../../utils/format";
import ProjectMenu from "./ProjectMenu";

function ProjectCard({ project, onDeleteClick = () => {} }) {
  const navigate = useNavigate();
  const open = () => navigate(ROUTES.PROJECT(project.id));

  const preview = htmlToText(project.content);
  const updatedAt = getUpdatedAt(project);

  return (
    <div
      className="project-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="project-card-top">
        <span className="project-icon">
          <FileText size={19} strokeWidth={1.9} />
        </span>
        <span className="project-card-name" title={project.name}>
          {project.name}
        </span>
        <ProjectMenu project={project} onDeleteClick={onDeleteClick} />
      </div>

      <div className="project-preview">
        {preview ? (
          preview.slice(0, 400)
        ) : (
          <span className="project-preview-empty">Documento vacío</span>
        )}
      </div>

      <span className="project-card-meta" title={formatFull(updatedAt)}>
        Modificado {formatRelative(updatedAt)}
      </span>
    </div>
  );
}

export default ProjectCard;
