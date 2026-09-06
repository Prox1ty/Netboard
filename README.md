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
│   │   │   └── index.ts             # Canvas and zoom constants
│   │   ├── operations/
│   │   │   ├── opDefs/
│   │   │   │   ├── brushOps.ts       # Brush drawing and history operations
│   │   │   │   ├── circleOps.ts      # Circle operation placeholder
│   │   │   │   ├── rectangleOps.ts   # Rectangle operation placeholder
│   │   │   │   ├── selectOps.ts      # Selection operation placeholder
│   │   │   │   └── index.ts
│   │   │   └── strokeOps.ts
│   │   ├── types/
│   │   │   ├── Point.ts
│   │   │   ├── Stroke.ts
│   │   │   ├── VisibleChunkRange.ts
│   │   │   ├── opTypes.ts            # Tool handler types and registry
│   │   │   ├── tool.ts               # Available tool names
│   │   │   └── index.ts
│   │   ├── Camera.ts                 # Pan, zoom, and coordinate conversion
│   │   ├── Canvas.ts                 # Canvas state and input handling
│   │   ├── Renderer.ts               # Canvas drawing and rerendering
│   │   └── SpatialLogic.ts           # Chunk indexing and visibility logic
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── sidebar_components/
│   │   │   │   └── ColorPalette.tsx  # Color selector (in development)
│   │   │   ├── Tools/
│   │   │   │   ├── BrushTool.tsx
│   │   │   │   ├── SelectTool.tsx
│   │   │   │   └── index.ts
│   │   │   ├── SideBar.tsx
│   │   │   └── ToolBar.tsx
│   │   ├── context/
│   │   │   ├── ToolContext.ts        # Tool and color context definition
│   │   │   └── ToolContextProvider.tsx
│   │   ├── WhiteBoard/
│   │   │   └── WhiteBoard.tsx         # Canvas UI and event forwarding
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
│
├── package.json
├── README.md
└── tsconfig.json
```

The `engine` directory contains the reusable canvas layer. `Canvas.ts` coordinates input, camera state, stroke storage, spatial indexing, and undo/redo history. `Renderer.ts` draws board boundaries and visible strokes, while `Camera.ts` handles panning, zooming, and coordinate conversion. Operation definitions provide the tool-specific mouse and history handlers.

The `frontend` directory contains the React application. `WhiteBoard.tsx` owns the canvas element and connects browser events to the engine. The toolbar and sidebar provide the visible controls, while the tool context stores the selected tool and color state shared by those controls.

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
