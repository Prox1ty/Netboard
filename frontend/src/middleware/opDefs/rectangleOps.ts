import type CanvasInstance from "../../../../engine/src/Canvas"
import { type ToolHandler } from "../opTypes";
import type { Point } from "../../../../engine/src/types";

export const rectangleTool: ToolHandler = {
    mouseDown(engine: CanvasInstance, point: Point, button: number) {
        engine.mouseDown(point.x, point.y, button);
    },
    mouseMove(engine: CanvasInstance, point: Point, button: number) {
        engine.mouseMove(point.x, point.y);
    },
    mouseUp(engine: CanvasInstance, point: Point, button: number) {
        engine.mouseUp(point.x, point.y, button);
    }
}
