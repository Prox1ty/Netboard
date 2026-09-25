import type CanvasInstance from "../../Canvas"
import { type ToolHandler } from "../../types/opTypes";
import type { Point } from "../../types";
import { Rectangle } from "../../types/DrawingObject/Rectangle";

export const rectangleTool: ToolHandler = {
    mouseDown(canvas: CanvasInstance, point: Point) {
        canvas.currentRect = {
            id: canvas.nextDrawingId++,
            type: "Rectangle",
            color: canvas.currentDrawingClr,
            point: canvas.camera.convertScreenToWorld(point),
            width: 0,
            height: 0,
        }
    },
    mouseMove(canvas: CanvasInstance, point: Point) {
         if (!canvas.currentRect) return;
        const worldMousePos = canvas.camera.convertScreenToWorld(point);
        canvas.currentRect.width = worldMousePos.x - canvas.currentRect.point.x;
        canvas.currentRect.height = worldMousePos.y - canvas.currentRect.point.y;

        if (
            canvas.currentRect.width != 0
            && canvas.currentRect.height != 0
        ) {
            // initiate rendering
            if (canvas.drawings.has(canvas.currentRect.id)) {
                canvas.deleteStroke(canvas.currentRect.id);
            }
            canvas.drawings.set(canvas.currentRect.id, canvas.currentRect);
            // throttle 
            canvas.fullBoardRender();
            canvas.applyContextTransform();
            canvas.renderer.throttledRender(canvas.currentRect);
        }

    },
    mouseUp(canvas: CanvasInstance, point: Point) {
        if (canvas.currentRect === null) return;
        // not adding the point where we do mouseUp since I don't think that's needed. 
        // make a copy to store before clearing the global variable
        const drawing: Rectangle = {
            id: canvas.currentRect.id,
            color: canvas.currentRect.color,
            type: "Rectangle",

            point: canvas.currentRect.point,
            
            width: canvas.currentRect.width,
            height: canvas.currentRect.height,
        };
        canvas.drawings.set(drawing.id, drawing);
        canvas.storeDrawingInChunk(drawing);

        if (canvas.strokeHistoryIndex < canvas.strokeHistory.length - 1) {
            const overwrittenIds = canvas.strokeHistory.slice(canvas.strokeHistoryIndex + 1, canvas.strokeHistory.length);

            for (const id of overwrittenIds) {
                canvas.deleteStroke(id);
            }

            canvas.strokeHistory.splice(canvas.strokeHistoryIndex + 1);
        }

        canvas.strokeHistory.push(drawing.id);
        canvas.strokeHistoryIndex++;
        canvas.operationHistory.push('rectangle');
        canvas.operationHistoryIndex++;

        canvas.currentRect = null;

    },
    undo(canvas: CanvasInstance) {
        if (canvas.strokeHistoryIndex < 0) return;

        canvas.strokeHistoryIndex--;
        canvas.fullBoardRender();
    },
    redo(canvas: CanvasInstance) {
        if (canvas.strokeHistoryIndex < 0) return;

        canvas.strokeHistoryIndex--;
        canvas.fullBoardRender();
    }
}
