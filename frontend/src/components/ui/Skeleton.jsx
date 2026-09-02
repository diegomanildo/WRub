export function Skeleton({ width = "100%", height = 14, radius, style }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Skeleton width={22} height={22} radius={4} />
        <Skeleton width="65%" height={12} />
      </div>
      <Skeleton height={118} radius={8} style={{ marginTop: 12 }} />
      <Skeleton width="45%" height={10} style={{ marginTop: 12 }} />
    </div>
  );
}

export function ProjectGridSkeleton({ count = 8 }) {
  return (
    <div className="project-grid" aria-busy="true" aria-label="Cargando proyectos">
      {Array.from({ length: count }, (_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="editor-scroll" aria-busy="true">
      <div className="editor-content">
        <Skeleton width="60%" height={26} />
        <Skeleton height={12} style={{ marginTop: 28 }} />
        <Skeleton height={12} style={{ marginTop: 12 }} />
        <Skeleton width="88%" height={12} style={{ marginTop: 12 }} />
        <Skeleton width="70%" height={12} style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}
