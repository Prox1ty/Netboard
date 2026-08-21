import type CanvasInstance from "../../../engine/src/Canvas";
import { type Point } from "../../../engine/src/types";
import { type Tool } from "../context/ToolContext";
import { brushTool, rectangleTool, circleTool, selectTool} from './opDefs'

export interface ToolHandler {
    mouseDown(
        engine: CanvasInstance,
        point: Point,
        button: number
    ): void;

    mouseMove(
        engine: CanvasInstance,
        point: Point,
        button: number
    ): void;

    mouseUp(
        engine: CanvasInstance,
        point: Point,
        button: number
    ): void;
}

// same for rectangle operation and such
export const toolHandlers: Record<Tool, ToolHandler> = {
    'brush': brushTool,
    rectangle: rectangleTool, // right now this one and the ones below contain the same definition to be changed later :P
    circle: circleTool,
    select: selectTool
}