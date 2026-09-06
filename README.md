# Netboard

Netboard is a browser-based whiteboard prototype. The current implementation provides a React and Vite interface backed by a TypeScript canvas engine. The backend contains an Express health endpoint and an initial Prisma/PostgreSQL schema.

## Current Features

- Draw freehand strokes with the brush tool.
- Pan the canvas with the middle mouse button.
- Zoom around the cursor with the mouse wheel. Zoom is limited to 0.1x through 5x.
- Undo and redo brush strokes with `Ctrl+Z` / `Cmd+Z` and `Ctrl+Y` / `Cmd+Y`.
- Render strokes in world coordinates using camera transforms.
- Index strokes by spatial chunks and rerender the visible area.
- Open a color-picker panel with an HSL color wheel, RGB inputs, a hexadecimal input, and a color preview.
- Use a responsive full-screen canvas layout with a sidebar and bottom toolbar.

## Project Structure

```text
.
├── engine/
│   ├── src/
│   │   ├── constants/
│   │   ├── operations/
│   │   │   └── opDefs/
│   │   ├── types/
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── sidebar_components/
│   │   │   └── Tools/
│   │   ├── context/
│   │   └── WhiteBoard/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
│
├── package.json
├── README.md
└── tsconfig.json
```

The `engine` directory contains the reusable canvas layer. Its source is organized into canvas modules, tool operations, shared types, and constants. Together, these modules handle input, camera state, stroke storage, rendering, spatial indexing, and undo/redo history.

The `frontend` directory contains the React application. Its source is organized into the whiteboard view, reusable UI components, tool controls, sidebar components, and context providers for shared tool state.

### Frontend

The frontend mounts the whiteboard through `ToolContextProvider`. `WhiteBoard` creates the canvas engine and forwards mouse, wheel, and keyboard events to it. The toolbar currently exposes brush and select controls, and the sidebar contains the color palette.

### Canvas Engine

The engine stores strokes in memory, assigns each stroke an ID and creation timestamp, and tracks stroke history for undo and redo. It uses a camera for screen-to-world and world-to-screen conversion, and a spatial index to identify strokes in visible chunks.

### Backend and Database

Yet to implement

## Running the Frontend

Install dependencies and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

Other frontend scripts are:

```bash
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

## Backend Configuration

Pending

## Current Limitations

- Drawing data is kept in browser memory and is not sent to the backend.
- The backend does not provide whiteboard CRUD, authentication, synchronization, or stroke persistence endpoints.
- The Prisma `Whiteboard` model is not used by the Express server yet.
- Rectangle, circle, and select operation handlers are placeholders.
- The color-picker state is implemented in the frontend, but it is not yet connected to the engine's brush stroke color.

## Technology

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Express
- Prisma
- PostgreSQL
