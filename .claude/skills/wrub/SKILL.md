---
name: wrub
description: Contexto y convenciones del proyecto WRub (React+Vite / Express / SQLite) — arquitectura, estructura de carpetas, estilos CSS con tokens, patrones de API y comandos. Usar al empezar cualquier tarea de código en este repo (features, bugs, refactors) para no tener que explorar desde cero.
---

# WRub

App web tipo Google Drive para redactar documentos por proyecto (editor Tiptap), con música de fondo y links de solo lectura para compartir. Todo el código, comentarios y textos de UI están **en español**.

## Stack

- **Frontend**: React 19 + Vite, React Router 7, Bootstrap 5 (solo base), CSS propio con tokens, Lucide React (íconos), Tiptap 3 (editor).
- **Backend**: Node + Express 5, CommonJS (`require`), capas routes → controllers → services → repositories.
- **DB**: SQLite vía `better-sqlite3` (sincrónico, sin `await`).

## Comandos

```bash
npm run dev                      # raíz: levanta back + front (concurrently)
npm run dev --prefix backend     # nodemon, puerto 3000
npm run dev --prefix frontend    # vite, puerto 5173
npm run lint --prefix frontend   # eslint (único check automático del repo; no hay tests)
```

`frontend/.env` → `VITE_API_URL=http://localhost:3000/api`
`backend/.env` → `DATABASE_PATH` (obligatoria, si falta el server tira error), `PORT`.

## Backend — `backend/src/`

```
config/database.js        conexión + CREATE TABLE + migraciones por ALTER
routes/*.routes.js        solo mapean path → controller
controllers/*.js          leen req, llaman al service, arman la response
services/project.service.js   reglas de negocio y validaciones
repositories/project.repository.js  SQL crudo con db.prepare()
```

Convenciones:
- Rutas montadas en `server.js` bajo `/api/...`; hay un error handler global al final que devuelve `{ error: mensaje }` con `error.status || 500`.
- Los errores de negocio se lanzan desde el service con `.status` seteado.
- El schema se versiona en `config/database.js`: `CREATE TABLE IF NOT EXISTS` + bloques `if (!columnNames.includes("x")) ALTER TABLE`. **Agregar columnas nuevas así**, nunca editando el CREATE original.
- La DB (`backend/data/`) y `backend/uploads/` no se trackean en git.
- Uploads (audio e imágenes) con `multer`, servidos estáticos desde `/uploads`.

## Frontend — `frontend/src/`

```
pages/            Home, Projects, Project, SharedProject
routes/           AppRoutes.jsx + paths.js (ROUTES.PROJECT(id), etc.)
components/layout, player, projects, ui
hooks/            hooks genéricos (useDismissable, useDocumentTitle)
services/         api.js (wrapper fetch) + projects.js, audio.js, images.js
utils/            format, indent, pagination, youtube
styles/           tokens.css + un archivo por área
```

Convenciones:
- Toda llamada HTTP pasa por `services/api.js` (`api.get/post/patch/delete`), que ya normaliza errores a `Error(error.error)` y maneja el 204. No usar `fetch` suelto en componentes.
- Las URLs se construyen con `ROUTES` de `routes/paths.js`, no strings a mano.
- La lógica pesada del editor vive en hooks al lado del componente (`useDocumentEditor.js`, `usePagination.js`), no dentro del JSX.
- Extensiones custom de Tiptap: par `X.js` (nodo) + `XView.jsx` (NodeView React) — ver `MusicParagraph` / `ResizableImage`.
- Feedback al usuario vía `ToastProvider`; estados de carga con `Skeleton`.

## Estilos

- **Nunca hardcodear colores, espaciados ni radios**: usar las variables de `styles/tokens.css` (`--c-primary`, `--c-text-secondary`, `--c-border`, etc.). Paleta estilo Google Drive: superficies blancas, grises neutros, acento azul `#1a73e8`.
- Un archivo CSS por área (`projects-page.css`, `editor-toolbar.css`, `share.css`…), importados desde `index.css`. Si una feature nueva tiene peso propio, crear su archivo ahí.
- Se usa `postcss-nested`, así que el anidado tipo Sass es válido.
- Bootstrap está para el reset y utilidades básicas; el look real lo dan los estilos propios.

## Feature de compartir

Un proyecto tiene `share_token` (random, distinto del id secuencial a propósito) y `share_enabled` (opt-in). El link público es `/compartir/:token` → `SharedProject.jsx`, que consume `/api/share/:token` (endpoint público, sin exponer el id). Acciones separadas del PATCH del proyecto: `POST /:id/share`, `DELETE /:id/share`, `POST /:id/share/rotate`.

## Al escribir código acá

- Español en nombres de UI, mensajes y comentarios; el código (variables/funciones) en inglés como ya está.
- Comentarios solo donde la decisión no es obvia (por qué, no qué) — es el estilo del repo.
- No hay tests: verificar con `npm run lint --prefix frontend` y, si aplica, levantando la app.
