import Point from "./types/Point";
import Stroke from "./types/Stroke";
import CanvasRenderer from "./Renderer"
import Camera from "./Camera";
import { VisibleChunkRange } from "./types";
import {CHUNK_WIDTH, CHUNK_HEIGHT} from "./constants/index"

import { getChunkCoordinate, getChunkKey, getVisibleChunkRange } from "./SpatialLogic";
import { createNewStroke } from "./operations/strokeOps";

export type ChunkCoordinate = `${number},${number}`;


export default class CanvasInstance {
    private canvas: HTMLCanvasElement;
    private renderer: CanvasRenderer;
    private ctx: CanvasRenderingContext2D;
    private camera: Camera;

    private spatialIndex = new Map<ChunkCoordinate, Set<number>>();
    private strokes = new Map<number, Stroke> ();
    private history: number[] = [];
    private historyIndex: number = -1;
    private nextStrokeId = 1;

    private currentStroke: Stroke;
    public currentStrokeClr = "red";

    private visibleChunkRange: VisibleChunkRange;


    private isRenderPending: boolean = false;
    private readonly MIN_POINT_DISTANCE: number = 3;

    private isPanning: boolean = false;
    private lastMousePosition: Point | null = null;

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

    mouseDown(x: number, y: number, button: number) : void {
        
        
        if (button === 1) {
            this.isPanning = true;
            this.lastMousePosition = { x, y };
            return;
        }
        
        const worldPoints = this.camera.convertScreenToWorld({x, y});

        this.currentStroke = createNewStroke(
            this.nextStrokeId++,
            this.currentStrokeClr,
            worldPoints.x, 
            worldPoints.y
        )

        // sets lastRenderedIndex
        this.renderer.beginStroke(this.currentStroke.points.length - 1);
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
    mouseMove(x: number, y: number) : void {
        // will only run if isPanning is true
        this.screenPan(x, y);

        const worldPoints = this.camera.convertScreenToWorld({x, y});

        if (this.validPoint(worldPoints.x, worldPoints.y)) {
            this.currentStroke.points.push(worldPoints);
        }

        if (!this.isRenderPending) {
            this.isRenderPending = true;

            this.applyContextTransform();

            requestAnimationFrame(() => {
                this.renderer.renderStroke(this.currentStroke);
                this.isRenderPending = false;
            }) 
        }
    }

    mouseUp(x: number, y: number, button: number): void {
        if (button === 1) {
            this.isPanning = false;
            this.lastMousePosition = null;
            return;
        }
        // at this point just render whatever's in the currentStroke array.
        // Note: i dont think we need to apply context transform here again. But if somehow the rendering looks weird then something might've changed the transform properties. Do check that just in case
        const worldPoints = this.camera.convertScreenToWorld({x, y});
        this.currentStroke.points.push(worldPoints);
        this.renderer.renderStroke(this.currentStroke);
        
        // making a copy
        const finishedStroke: Stroke = {
            ...this.currentStroke,
            points: [...this.currentStroke.points]
        }
        this.strokes.set(finishedStroke.id, finishedStroke);
        this.storeStrokeInChunk(finishedStroke);

        // if the current history pointer is not at the latest element and we add a new element, delete existing redundant strokes since history is going to be overwritten anyway
        if (this.historyIndex < this.history.length - 1) {
            const overwrittenIds = this.history.slice(this.historyIndex + 1, this.history.length);

            for (const id of overwrittenIds) {
                this.deleteStroke(id);
            }

            this.history.splice(this.historyIndex + 1);
        }
        
        this.history.push(finishedStroke.id);
        this.historyIndex++;

        this.currentStroke.points = [];
        this.isRenderPending = false;

        this.renderer.endStroke();

        console.log(this.spatialIndex);
    }

    undo() {
        if (this.historyIndex < 0) return;

        this.historyIndex--;
        this.fullBoardRender();
    }

    redo() {
        if (this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        this.fullBoardRender();
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
        const activeStrokeIds = this.getActiveHistoryStrokes();

        // clear out old canvas
        this.renderer.clear(this.canvas);

        this.applyContextTransform();

        this.renderer.drawBoardBoundaries(this.camera, this.canvas);
        this.renderer.reRenderStrokes(this.spatialIndex,this.strokes, getVisibleChunkRange(this.camera, this.canvas), activeStrokeIds);
    }

    getActiveHistoryStrokes(): number[] {
        return this.history.slice(0, this.historyIndex + 1);
    }

    deleteStroke(id: number) {
        this.strokes.delete(id);

        for (const [chunk, strokeIds] of this.spatialIndex) {
            strokeIds.delete(id);
        }
    }
}