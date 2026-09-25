import type CanvasInstance from "../../Canvas"
import { type ToolHandler } from "../../types/opTypes";
import type { Point } from "../../types";
import { getChunkCoordinate } from "../../SpatialLogic";
import type { ChunkCoordinate } from "../../Canvas";

export const selectTool: ToolHandler = {
    mouseDown(canvas: CanvasInstance, point: Point) {
        canvas.currentSelection = {
            point: canvas.camera.convertScreenToWorld(point),
            width: 0,
            height: 0,
        };
    },
    mouseMove(canvas: CanvasInstance, point: Point) {
        if (!canvas.currentSelection) return;

        const worldMousePos = canvas.camera.convertScreenToWorld(point);

        canvas.currentSelection.width = worldMousePos.x - canvas.currentSelection.point.x;
        canvas.currentSelection.height = worldMousePos.y - canvas.currentSelection.point.y;

        canvas.fullBoardRender();

        canvas.applyContextTransform();

        canvas.renderer.throttledSelectRender(canvas.currentSelection);

    },
    mouseUp(canvas: CanvasInstance, point: Point) {
        if (!canvas.currentSelection) return;
        const worldMousePos = canvas.camera.convertScreenToWorld(point);

        const startX = canvas.currentSelection?.point.x!;
        const endX = worldMousePos.x;
        const startY = canvas.currentSelection?.point.y!;
        const endY = worldMousePos.y;

        const selectionMinX = Math.min(startX, endX);
        const selectionMaxX = Math.max(startX, endX);
        const selectionMinY = Math.min(startY, endY);
        const selectionMaxY = Math.max(startY, endY);
        
        const chunkStart = getChunkCoordinate(selectionMinX, selectionMinY);
        const chunkEnd = getChunkCoordinate(selectionMaxX, selectionMaxY);

        // inside these chunks, we'll need to find strokes that are completely contained inside the selection
        for (let i = chunkStart[0]; i <= chunkEnd[0]; i++) {
            for (let j = chunkStart[1]; j <= chunkEnd[1]; j++) {
                const currentChunkKey: ChunkCoordinate = `${i},${j}`;
                const drawingIds = canvas.spatialIndex.get(currentChunkKey);

                if (!drawingIds) continue;

                for (const id of drawingIds) {
                    const drawing = canvas.drawings.get(id);
                    if (!drawing) continue;

                    let fitsStartX: boolean = true;
                    let fitsStartY: boolean = true;
                    let fitsEndX: boolean = true;
                    let fitsEndY: boolean = true;
                    
                    switch(drawing.type) {
                        case "FreeHandDrawing":
                            for (const point of drawing.points) {
                                if (!(point.x >= selectionMinX)) fitsStartX = false;
                                if (!(point.x <= selectionMaxX)) fitsEndX = false;
                                if (!(point.y >= selectionMinY)) fitsStartY = false;
                                if (!(point.y <= selectionMaxY)) fitsEndY = false;
                            }
                            break;
                        case "Rectangle": {
                            const rectLeft = drawing.point.x;
                            const rectTop = drawing.point.y;
                            const rectRight = drawing.point.x + drawing.width;
                            const rectBottom = drawing.point.y + drawing.height;

                            if (!(rectLeft >= selectionMinX)) fitsStartX = false;
                            if (!(rectRight <= selectionMaxX)) fitsEndX = false;
                            if (!(rectTop >= selectionMinY)) fitsStartY = false;
                            if (!(rectBottom <= selectionMaxY)) fitsEndY = false;
                            break;
                        }
                        case "Circle": {
                            const circleLeft = Math.min(drawing.start.x, drawing.end.x);
                            const circleTop = Math.min(drawing.start.y, drawing.end.y);
                            const circleRight = Math.max(drawing.start.x, drawing.end.x);
                            const circleBottom = Math.max(drawing.start.y, drawing.end.y);

                            if (!(circleLeft >= selectionMinX)) fitsStartX = false;
                            if (!(circleRight <= selectionMaxX)) fitsEndX = false;
                            if (!(circleTop >= selectionMinY)) fitsStartY = false;
                            if (!(circleBottom <= selectionMaxY)) fitsEndY = false;
                            break;
                        }
                    }

                    if (
                        fitsStartX &&
                        fitsEndX &&
                        fitsStartY &&
                        fitsEndY
                    ) {
                        canvas.selectedDrawings.add(id);
                        // add an outline around it.
                        // if (selectedDrawing.thickness)
                        //     selectedDrawing.thickness = selectedDrawing.thickness + 3;
                        // selectedDrawing.color = 'rgba(0, 64, 177, 0.6)';
                        // selectedDrawingIds.push(id);
                    }
                }
            }
        }
        
        canvas.currentSelection = null;
        canvas.fullBoardRender();
        canvas.isSelected = true;
    },
    undo(_canvas: CanvasInstance) {

    },
    redo(_canvas: CanvasInstance) {
        
    }
}
