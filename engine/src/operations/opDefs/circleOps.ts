import type CanvasInstance from "../../Canvas"
import { type ToolHandler } from "../../types/opTypes";
import type { Point } from "../../types";
import type { Circle } from "../../types/DrawingObject/Circle";

export const circleTool: ToolHandler = {
    mouseDown(canvas: CanvasInstance, point: Point) {
        const start = canvas.camera.convertScreenToWorld(point);
        canvas.currentCircle = {
            id: canvas.nextDrawingId++,
            type: "Circle",
            color: canvas.currentDrawingClr,
            thickness: canvas.currentStrokeThickness,
            start,
            end: start,
        };
    },
    mouseMove(canvas: CanvasInstance, point: Point) {
        if (!canvas.currentCircle) return;

        canvas.currentCircle.end = canvas.camera.convertScreenToWorld(point);

        if (
            canvas.currentCircle.end.x !== canvas.currentCircle.start.x
            && canvas.currentCircle.end.y !== canvas.currentCircle.start.y
        ) {
            if (canvas.drawings.has(canvas.currentCircle.id)) {
                canvas.deleteStroke(canvas.currentCircle.id);
            }

            canvas.drawings.set(canvas.currentCircle.id, canvas.currentCircle);
            canvas.fullBoardRender();
            canvas.applyContextTransform();
            canvas.renderer.throttledCircleRender(canvas.currentCircle);
        }
    },
    mouseUp(canvas: CanvasInstance, point: Point) {
        if (canvas.currentCircle === null) return;

        canvas.currentCircle.end = canvas.camera.convertScreenToWorld(point);

        const drawing: Circle = {
            id: canvas.currentCircle.id,
            color: canvas.currentCircle.color,
            type: "Circle",
            thickness: canvas.currentCircle.thickness ?? canvas.currentStrokeThickness,
            start: canvas.currentCircle.start,
            end: canvas.currentCircle.end,
        };

        canvas.drawings.set(drawing.id, drawing);
        canvas.storeDrawingInChunk(drawing);

        if (canvas.strokeHistoryIndex < canvas.strokeHistory.length - 1) {
            const overwrittenIds = canvas.strokeHistory.slice(canvas.strokeHistoryIndex + 1);

            for (const id of overwrittenIds) {
                canvas.deleteStroke(id);
            }

            canvas.strokeHistory.splice(canvas.strokeHistoryIndex + 1);
        }

        canvas.strokeHistory.push(drawing.id);
        canvas.strokeHistoryIndex++;
        canvas.operationHistory.push('circle');
        canvas.operationHistoryIndex++;
        canvas.currentCircle = null;
    },
    undo(canvas: CanvasInstance) {
        if (canvas.strokeHistoryIndex < 0) return;

        canvas.strokeHistoryIndex--;
        canvas.fullBoardRender();
    },
    redo(canvas: CanvasInstance) {
        if (canvas.strokeHistoryIndex >= canvas.strokeHistory.length - 1) return;

        canvas.strokeHistoryIndex++;
        canvas.fullBoardRender();
    }
}
