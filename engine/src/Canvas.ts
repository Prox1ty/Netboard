import Point from "./types/Point";
import Stroke from "./types/Stroke";
import CanvasRenderer from "./Renderer"
import { VisibleChunkRange } from "./types";
import {CHUNK_WIDTH, CHUNK_HEIGHT} from "./constants/index"

import { getChunkCoordinate, getChunkKey, getVisibleChunkRange } from "./SpatialLogic";
import { createNewStroke } from "./operations/strokeOps";

export type ChunkCoordinate = `${number},${number}`;


export default class CanvasInstance {
    private canvas: HTMLCanvasElement;
    private renderer: CanvasRenderer;
    private ctx: CanvasRenderingContext2D;
    private container: HTMLDivElement;

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

    constructor(canvasEl: HTMLCanvasElement, container: HTMLDivElement) {
        this.canvas = canvasEl;
        this.container = container
        this.ctx = this.canvas.getContext('2d')!;

        this.renderer = new CanvasRenderer(this.ctx, this.container);

        this.currentStroke = {
            id: 0,
            createdAt: 0,
            color: "black",
            points: []
        }

        if (!this.ctx) {
            throw new Error('2D context unavailable');
        }

        this.renderer.drawBoardBoundaries(this.canvas);
        this.visibleChunkRange = getVisibleChunkRange(this.container);
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

    mouseDown(x: number, y: number) : void {
        this.currentStroke = createNewStroke(
            this.nextStrokeId++,
            this.currentStrokeClr,
            x, y
        )

        // sets lastRenderedIndex
        this.renderer.beginStroke(this.currentStroke.points.length - 1);
    }


    // assumes mouse button is already pressed down
    mouseMove(x: number, y: number) : void {
        if (this.validPoint(x, y)) {
            this.currentStroke.points.push({x, y});
        }

        if (!this.isRenderPending) {
            this.isRenderPending = true;
            
            requestAnimationFrame(() => {
                this.renderer.renderStroke(this.currentStroke);
                this.isRenderPending = false;
            }) 
        }
    }

    mouseUp(x: number, y: number): void {
        // at this point just render whatever's in the currentStroke array.
        this.currentStroke.points.push({x, y});
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

            this.history = this.history.splice(0, this.historyIndex + 1);
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

    handleScroll() {
        const newRange: VisibleChunkRange = getVisibleChunkRange(this.container);
        if (this.sameChunkRange(this.visibleChunkRange, newRange)) {
            return; // don't need to re render at all.
        } 

        this.visibleChunkRange = newRange;
        this.fullBoardRender(); // dont need to rerender boundary lines. Trivial optimization.
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
        const activeStrokeIds = this.getActiveStrokeIds();

        // clear out old canvas
        this.renderer.clear(this.canvas);
        this.renderer.drawBoardBoundaries(this.canvas);
        this.renderer.reRenderStrokes(this.spatialIndex, this.strokes, activeStrokeIds);
    }

    getActiveStrokeIds(): number[] {
        return this.history.slice(0, this.historyIndex + 1);
    }

    deleteStroke(id: number) {
        this.strokes.delete(id);

        for (const [chunk, strokeIds] of this.spatialIndex) {
            strokeIds.delete(id);
        }
    }
}