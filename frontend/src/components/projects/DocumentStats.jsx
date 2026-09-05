import { useEffect, useState } from "react";
import { countText } from "../../utils/count";

/**
 * Contador de palabras y caracteres del documento.
 *
 * Se suscribe a las transacciones del editor en vez de recalcular en cada
 * render del padre: escribir dispara `update` sin re-renderizar `Project`,
 * así que sin esto el contador se quedaría clavado en el valor inicial.
 */
function DocumentStats({ editor }) {
  const [stats, setStats] = useState({ words: 0, characters: 0, charactersNoSpaces: 0 });

  useEffect(() => {
    if (!editor) return;

    const update = () => setStats(countText(editor.getText({ blockSeparator: " " })));

    update();
    editor.on("update", update);

    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  return (
    <span
      className="doc-stats"
      title={`${stats.charactersNoSpaces.toLocaleString("es-AR")} caracteres sin espacios`}
    >
      {stats.words.toLocaleString("es-AR")} {stats.words === 1 ? "palabra" : "palabras"}
      <span className="doc-stats-sep">·</span>
      {stats.characters.toLocaleString("es-AR")}{" "}
      {stats.characters === 1 ? "carácter" : "caracteres"}
    </span>
  );
}

export default DocumentStats;
