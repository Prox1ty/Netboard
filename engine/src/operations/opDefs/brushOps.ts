import type CanvasInstance from "../../Canvas"
import { type ToolHandler } from "../../types/opTypes";
import type { Point, Stroke } from "../../types";
import { createNewStroke } from "../strokeOps"; 

export const brushTool: ToolHandler = {
    mouseDown(canvas: CanvasInstance, point: Point) {
        const worldPoints = canvas.camera.convertScreenToWorld(point);
        
        canvas.currentStroke = createNewStroke(
            canvas.nextStrokeId++,
            canvas.currentStrokeClr,
            worldPoints.x, 
            worldPoints.y
        );


        
        // sets lastRenderedIndex
        canvas.renderer.beginStroke(canvas.currentStroke.points.length - 1);

    },
    mouseMove(canvas: CanvasInstance, point: Point) {
        const worldPoints = canvas.camera.convertScreenToWorld(point);

        if (canvas.validPoint(worldPoints.x, worldPoints.y)) {
            canvas.currentStroke.points.push(worldPoints);
        }

        if (!canvas.isRenderPending) {
            canvas.isRenderPending = true;

            canvas.applyContextTransform();

            requestAnimationFrame(() => {
                canvas.renderer.renderStroke(canvas.currentStroke);
                canvas.isRenderPending = false;
            }) 
        }

    },
    mouseUp(canvas: CanvasInstance, point: Point) {
        
        // at this point just render whatever's in the currentStroke array.
        // Note: i dont think we need to apply context transform here again. But if somehow the rendering looks weird then something might've changed the transform properties. Do check that just in case
        const worldPoints = canvas.camera.convertScreenToWorld(point);
        canvas.currentStroke.points.push(worldPoints);
        canvas.renderer.renderStroke(canvas.currentStroke);
        
        // making a copy
        const finishedStroke: Stroke = {
            ...canvas.currentStroke,
            points: [...canvas.currentStroke.points]
        }
        canvas.strokes.set(finishedStroke.id, finishedStroke);
        canvas.storeStrokeInChunk(finishedStroke);

        // if the current history pointer is not at the latest element and we add a new element, delete existing redundant strokes since history is going to be overwritten anyway
        if (canvas.strokeHistoryIndex < canvas.strokeHistory.length - 1) {
            const overwrittenIds = canvas.strokeHistory.slice(canvas.strokeHistoryIndex + 1, canvas.strokeHistory.length);

            for (const id of overwrittenIds) {
                canvas.deleteStroke(id);
            }

            canvas.strokeHistory.splice(canvas.strokeHistoryIndex + 1);
        }
        
        canvas.strokeHistory.push(finishedStroke.id);
        canvas.strokeHistoryIndex++;
        canvas.operationHistory.push('brush');
        canvas.operationHistoryIndex++;

        canvas.currentStroke.points = [];
        canvas.isRenderPending = false;

        canvas.renderer.endStroke();

        console.log(canvas.spatialIndex);
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
