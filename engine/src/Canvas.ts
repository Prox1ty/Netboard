import Point from "./types/Point";
import Stroke from "./types/Stroke";
import CanvasRenderer from "./Renderer"
import Camera from "./Camera";
import { VisibleChunkRange } from "./types";
import { type Tool } from "./types/tool";
import { toolHandlers, type ToolHandler } from "./types/opTypes";

import { getChunkCoordinate, getChunkKey, getVisibleChunkRange } from "./SpatialLogic";

export type ChunkCoordinate = `${number},${number}`;


export default class CanvasInstance {
    canvas: HTMLCanvasElement;
    renderer: CanvasRenderer;
    ctx: CanvasRenderingContext2D;
    camera: Camera;

    spatialIndex = new Map<ChunkCoordinate, Set<number>>();
    strokes = new Map<number, Stroke> ();

    operationHistory: Tool[] = [];
    operationHistoryIndex: number = -1;

    strokeHistory: number[] = [];
    strokeHistoryIndex: number = -1;
    nextStrokeId = 1;

    currentStroke: Stroke;
    currentStrokeClr = "red";

    visibleChunkRange: VisibleChunkRange;


    isRenderPending: boolean = false;
    readonly MIN_POINT_DISTANCE: number = 3;

    isPanning: boolean = false;
    lastMousePosition: Point | null = null;

    constructor(canvasEl: HTMLCanvasElement) {
        this.canvas = canvasEl;
        this.ctx = this.canvas.getContext('2d')!;
        this.camera = new Camera();
        this.resizeCanvas(window.innerWidth, window.innerHeight);
        
        this.renderer = new CanvasRenderer(this.ctx);

        this.currentStroke = {
            id: 0,
            createdAt: 0,
            color: "black",
            points: []
        }

        if (!this.ctx) {
            throw new Error('2D context unavailable');
        }

        this.renderer.drawBoardBoundaries(this.camera, this.canvas);
        this.visibleChunkRange = getVisibleChunkRange(this.camera, this.canvas);
    }

    resizeCanvas(w: number, h: number) {
        this.canvas.width = w;
        this.canvas.height = h;

        console.log({
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            rect: this.canvas.getBoundingClientRect()
        });
    }

    validPoint(x: number, y: number) : boolean {
        if (this.currentStroke.points.length <= 0) return false;

        // allow undefined to get rid of annoying strict check
        const lastPoint: Point | undefined = this.currentStroke.points[this.currentStroke.points.length - 1];

        if (lastPoint) {
            const dx = x - lastPoint.x;
            const dy = y - lastPoint.y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (distance < this.MIN_POINT_DISTANCE) {
                return false;
            }

            return true;
            
        } else {
            return false;
        }

    }

    mouseDown(x: number, y: number, button: number, tool: Tool) : void {
        
        
        if (button === 1) {
            this.isPanning = true;
            this.lastMousePosition = { x, y };
            return;
        }
        
        

        toolHandlers[tool].mouseDown(this, {x, y});
    }

    applyContextTransform() {
        this.ctx.setTransform(
            this.camera.zoom,
            0,
            0,
            this.camera.zoom,
            -this.camera.x * this.camera.zoom,
            -this.camera.y * this.camera.zoom
        );
    }
    // assumes mouse button is already pressed down
    mouseMove(x: number, y: number, tool: Tool) : void {
        // will only run if isPanning is true
        this.screenPan(x, y);

        toolHandlers[tool].mouseMove(this, {x, y});
    }

    mouseUp(x: number, y: number, button: number, tool: Tool): void {
        if (button === 1) {
            this.isPanning = false;
            this.lastMousePosition = null;
            return;
        }

        toolHandlers[tool].mouseUp(this, {x, y});
        if (this.operationHistoryIndex < this.operationHistory.length - 1) { // if a mouseup is registered at a non-latest operation 
            // again id deletion will be managed by the toolHandler function.
            this.reWriteOperationHistory();
        }
    }

    undo() {
        if (this.operationHistoryIndex < 0) return;
        const lastTool: Tool = this.operationHistory[this.operationHistoryIndex]!;
        toolHandlers[lastTool].undo(this);
        this.operationHistoryIndex--;
    }

    redo() {
        if (this.operationHistoryIndex >= this.operationHistory.length - 1) return;

        const lastTool: Tool = this.operationHistory[this.operationHistoryIndex]!;
        toolHandlers[lastTool].redo(this);
        this.operationHistoryIndex++;
    }

    screenPan(currentX: number, currentY: number) {
        if (this.isPanning && this.lastMousePosition) {
            const dx = currentX - this.lastMousePosition.x;
            const dy = currentY - this.lastMousePosition.y;
            
            this.camera.x -= dx / this.camera.zoom;
            this.camera.y -= dy / this.camera.zoom;

            this.lastMousePosition = { x: currentX, y: currentY };
            this.applyContextTransform();
            this.fullBoardRender();
        }
    }
    screenZoom(x: number, y: number, zoomFactor: number) {
        this.camera.zoomAt(x, y, zoomFactor);
        console.log("Zoom: ", this.camera.zoom);

        console.log({
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            rect: this.canvas.getBoundingClientRect(),
            computed: {
                width: getComputedStyle(this.canvas).width,
                height: getComputedStyle(this.canvas).height,
                transform: getComputedStyle(this.canvas).transform,
                zoom: getComputedStyle(this.canvas).zoom,
            }
        });

        this.fullBoardRender();
    }

    handleUndo() {
        this.undo();
    }

    handleRedo() {
        this.redo();
    }

    storeStrokeInChunk(stroke: Stroke): void {
        // we look at every point and check which chunk it belongs to. Then we store the whole stroke in that chunk. 

        const visited = new Set<ChunkCoordinate>(); // flag Set

        for (const point of stroke.points) {

            const chunk = getChunkKey(
                point.x,
                point.y
            );

            // we don't need the same stroke multiple times in the same chunk.
			// the points loop is only here to check if the stroke spans multiple chunks
            
            if (visited.has(chunk))
                continue;

            visited.add(chunk);

            if (!this.spatialIndex.has(chunk)) {
                this.spatialIndex.set(chunk, new Set);
            }

            this.spatialIndex.get(chunk)!.add(stroke.id);
        }
    }

    sameChunkRange(oldR: VisibleChunkRange, newR: VisibleChunkRange): boolean {
        if (
            oldR.minX != newR.minX
            || oldR.minY != newR.minY
            || oldR.maxX != newR.maxX
            || oldR.maxY != newR.maxY
        ) {
            return false;
        }

        return true;
    }

    fullBoardRender() {
        const activeStrokeIds = this.getActiveStrokeHistoryStrokes();

        // clear out old canvas
        this.renderer.clear(this.canvas);

        this.applyContextTransform();

        this.renderer.drawBoardBoundaries(this.camera, this.canvas);
        this.renderer.reRenderStrokes(this.spatialIndex,this.strokes, getVisibleChunkRange(this.camera, this.canvas), activeStrokeIds);
    }

    getActiveStrokeHistoryStrokes(): number[] {
        return this.strokeHistory.slice(0, this.strokeHistoryIndex + 1);
    }

    deleteStroke(id: number) {
        this.strokes.delete(id);

        for (const [chunk, strokeIds] of this.spatialIndex) {
            strokeIds.delete(id);
        }
    }

    reWriteOperationHistory() {
        // REMOVE OVERWRITTEN OPERATIONS. THEIR IDs WILL BE REMOVED IN THEIR RESPECTIVE MOUSEUP OPERATION
        this.operationHistory.splice(this.operationHistoryIndex + 1);
    }
}
