const OPEN = "";
const CLOSE = "";

/**
 * Fragmento del resultado de búsqueda con los términos encontrados
 * resaltados.
 *
 * El backend marca los términos con los caracteres de control  y
 *  en vez de <mark> (ver el repositorio): el texto es contenido
 * escrito por el usuario, así que se parte acá y los <mark> se arman como
 * elementos de React. Insertarlo con dangerouslySetInnerHTML ejecutaría el
 * HTML que hubiera dentro del documento.
 */
function SearchSnippet({ snippet }) {
  if (!snippet) return null;

  // Al partir por el delimitador de apertura, todo trozo salvo el primero
  // arranca con texto resaltado hasta el delimitador de cierre.
  const parts = snippet.split(OPEN);

  return (
    <>
      {parts.map((part, index) => {
        if (index === 0) return part;

        const [highlighted, rest = ""] = part.split(CLOSE);

        return (
          <span key={index}>
            <mark className="search-mark">{highlighted}</mark>
            {rest}
          </span>
        );
      })}
    </>
  );
}

export default SearchSnippet;
