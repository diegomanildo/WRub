# WRub

App web para crear, organizar y editar documentos por proyecto, pensada como un Google Drive pero enfocada en redactar contenido que después se exporta a PDF. Cada proyecto tiene su propio documento con editor de texto enriquecido, y de fondo se puede reproducir música mientras escribís.

## Stack

- **Frontend**: React + Vite, Bootstrap para estilos, Lucide React para íconos, Tiptap como editor de texto.
- **Backend**: Node.js + Express, arquitectura REST (routes / controllers / services / repositories).
- **Base de datos**: SQLite (better-sqlite3).

## Requisitos

- Node.js 18+
- npm

## Instalación

Cloná el repo y desde la raíz instalá las dependencias de los tres package.json (raíz, backend y frontend):

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3000/api
```

## Uso

Desde la raíz, esto levanta backend y frontend juntos (usa `concurrently`):

```bash
npm run dev
```

O por separado:

```bash
# backend (nodemon, puerto 3000)
npm run dev --prefix backend

# frontend (vite)
npm run dev --prefix frontend
```

El frontend queda disponible en la URL que muestre Vite (por defecto `http://localhost:5173`) y consume la API en `http://localhost:3000/api`.

## Scripts backend

- `npm run dev` – server con nodemon
- `npm start` – server en modo normal

## Scripts frontend

- `npm run dev` – servidor de desarrollo
- `npm run build` – build de producción
- `npm run lint` – eslint
- `npm run preview` – preview del build

## Estado del proyecto

En desarrollo activo. Por ahora soporta creación y organización de proyectos, edición de documentos con formato (Tiptap) y reproducción de audio/YouTube de fondo. La exportación a PDF y otras features siguen en construcción.
