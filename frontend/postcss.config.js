// Vite ya corre PostCSS internamente — este archivo solo suma el plugin
// de nesting (postcss-nested). No hace falta nada más en vite.config.js;
// Vite detecta postcss.config.js solo.
export default {
  plugins: {
    "postcss-nested": {},
  },
};
