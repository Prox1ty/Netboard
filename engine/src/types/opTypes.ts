import type CanvasInstance from "../Canvas";
import { type Point } from ".";
import { type Tool } from "./tool";
import { brushTool, rectangleTool, circleTool, selectTool} from '../operations/opDefs'

export interface ToolHandler {
    mouseDown(
        canvas: CanvasInstance,
        point: Point,
    ): void;

    mouseMove(
        canvas: CanvasInstance,
        point: Point,
    ): void;

    mouseUp(
        canvas: CanvasInstance,
        point: Point,
    ): void;

    undo(
        canvas: CanvasInstance
    ): void

    redo(
        canvas: CanvasInstance
    ): void
}

// same for rectangle operation and such
export const toolHandlers: Record<Tool, ToolHandler> = {
    brush: brushTool,
    rectangle: rectangleTool, // right now this one and the ones below contain the same definition to be changed later :P
    circle: circleTool,
    select: selectTool
}