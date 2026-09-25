import type { ToolHandler } from "../../types/opTypes";
import type CanvasInstance from "../../Canvas";
export const deleteTool: ToolHandler = {
    undo(canvas: CanvasInstance) {
        const index = canvas.operationHistoryIndex;
        const restoredDrawings = canvas.deleteHistory.get(index);
        console.log(restoredDrawings);
        if (!restoredDrawings) return;

        for (const drawing of restoredDrawings) {
            canvas.drawings.set(drawing.id, drawing);
            canvas.storeDrawingInChunk(drawing);
        }

        canvas.fullBoardRender();
    },
    redo(canvas: CanvasInstance) {
        const index = canvas.operationHistoryIndex + 1;
        const drawingsArr = canvas.deleteHistory.get(index);

        if (!drawingsArr) return;

        for (let obj of drawingsArr) {
            canvas.deleteStroke(obj.id); // actually deleting the thing
        }

        canvas.fullBoardRender();
    }
}