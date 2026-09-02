import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import { formatRelative, formatFull, getUpdatedAt, htmlToText } from "../../utils/format";
import ProjectMenu from "./ProjectMenu";

function ProjectRow({ project, onDeleteClick = () => {} }) {
  const navigate = useNavigate();
  const open = () => navigate(ROUTES.PROJECT(project.id));

  const updatedAt = getUpdatedAt(project);
  const desc = project.description || htmlToText(project.content).slice(0, 120);

  return (
    <div
      className="project-row"
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
      <span className="project-row-name">
        <span className="project-icon">
          <FileText size={18} strokeWidth={1.9} />
        </span>
        <span className="truncate">{project.name}</span>
      </span>

      <span className="project-row-desc truncate">{desc || "—"}</span>

      <span className="project-row-date" title={formatFull(updatedAt)}>
        {formatRelative(updatedAt)}
      </span>

      <ProjectMenu project={project} onDeleteClick={onDeleteClick} />
    </div>
  );
}

export default ProjectRow;
