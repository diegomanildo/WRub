import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageView from "./ResizableImageView";

/**
 * Image de Tiptap + atributo `width` (persistido como `style="width: Xpx"`
 * en el HTML del documento) para poder arrastrar una esquina y cambiar el
 * tamaño, como en Drive/Docs. La altura nunca se guarda: queda en `auto`
 * (ver CSS), así el aspect ratio original se mantiene solo.
 */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const styleWidth = parseInt(el.style.width, 10);
          if (Number.isFinite(styleWidth)) return styleWidth;
          const attrWidth = parseInt(el.getAttribute("width"), 10);
          return Number.isFinite(attrWidth) ? attrWidth : null;
        },
        renderHTML: (attrs) =>
          attrs.width ? { style: `width: ${attrs.width}px` } : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
