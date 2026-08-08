import Point from "../types/Point";
import Stroke from "../types/Stroke";
import { VisibleChunkRange } from "../types/VisibleChunkRange";
import {CHUNK_WIDTH, CHUNK_HEIGHT} from "../constants/index"

type ChunkCoordinate = `${number},${number}`;


export default class CanvasInstance {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private container: HTMLDivElement;

    private spatialIndex = new Map<ChunkCoordinate, Set<number>>();
    private strokes = new Map<number, Stroke> ();

    private currentStroke: Stroke;
    private nextStrokeId;
    public currentStrokeClr = "red";

    private visibleChunkRange: VisibleChunkRange;

    private lastRenderedIndex: number;

    private isRenderPending: boolean = false;
    private readonly MIN_POINT_DISTANCE: number = 3;

    constructor(canvasEl: HTMLCanvasElement, container: HTMLDivElement) {
        this.canvas = canvasEl;
        this.container = container
        this.ctx = this.canvas.getContext('2d')!;
        this.nextStrokeId = 1;
        this.lastRenderedIndex = 0;
        this.currentStroke = {
            id: 0,
            createdAt: 0,
            color: "black",
            points: []
        }

        if (!this.ctx) {
            throw new Error('2D context unavailable');
        }

        this.drawBoardBoundaries();
        this.visibleChunkRange = this.getVisibleChunkRange();
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
        this.currentStroke = {
            id: this.nextStrokeId++,
            color: this.currentStrokeClr,
            points: [{x, y}],
            createdAt: Date.now()
        }

        this.lastRenderedIndex = this.currentStroke.points.length - 1;
    }



    mouseMove(x: number, y: number) : void {
        if (this.validPoint(x, y)) {
            this.currentStroke.points.push({x, y});
        }

        if (!this.isRenderPending) {
            this.isRenderPending = true;
            
            requestAnimationFrame(() => {
                this.render();
                this.isRenderPending = false;
            }) 
        }
    }

    mouseUp(x: number, y: number): void {
        // at this point just render whatever's in the currentStroke array.
        this.currentStroke.points.push({x, y});
        this.render();
        
        // making a copy
        const finishedStroke: Stroke = {
            ...this.currentStroke,
            points: [...this.currentStroke.points]
        }
        this.strokes.set(finishedStroke.id, finishedStroke);

        this.storeStrokeInChunk(finishedStroke);

        this.currentStroke.points = [];
        this.lastRenderedIndex = 0;
        this.isRenderPending = false;

        console.log(this.spatialIndex);
    }

    handleScroll() {
        const newRange: VisibleChunkRange = this.getVisibleChunkRange();
        if (this.sameChunkRange(this.visibleChunkRange, newRange)) {
            return; // don't need to re render at all.
        } 

        this.visibleChunkRange = newRange;
        this.fullBoardRender(); // dont need to rerender boundary lines. Trivial optimization.
    }

    // returns key 
    getChunkKey(x: number, y: number): ChunkCoordinate {
        const chunkX = Math.floor(x / CHUNK_WIDTH);
        const chunkY = Math.floor(y / CHUNK_HEIGHT);

        return `${chunkX},${chunkY}`;
    }

    // returns actual integer chunk coordinates in an array
    getChunkCoordinate(x: number, y: number): [number, number] {
    return [
        Math.floor(x / CHUNK_WIDTH),
        Math.floor(y / CHUNK_HEIGHT)
    ];
}

    storeStrokeInChunk(stroke: Stroke): void {
        // we look at every point and check which chunk it belongs to. Then we store the whole stroke in that chunk. 

        const visited = new Set<ChunkCoordinate>(); // flag Set

        for (const point of stroke.points) {

            const chunk = this.getChunkKey(
                point.x,
                point.y
            );

            if (visited.has(chunk))
                continue;

            visited.add(chunk);

            if (!this.spatialIndex.has(chunk)) {
                this.spatialIndex.set(chunk, new Set);
            }

            this.spatialIndex.get(chunk)!.add(stroke.id);
        }
    }

    getVisibleChunkRange(): VisibleChunkRange {
        const top = this.container.scrollTop;
        const left = this.container.scrollLeft;
        const right = left + this.container.clientWidth;
        const bottom = top + this.container.clientHeight;
             

        const [minX, minY] : number[] = this.getChunkCoordinate(left, top);
        const [maxX, maxY]: number[] = this.getChunkCoordinate(right, bottom);

        return { 
            minY,
            maxY,
            minX,
            maxX
        };
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

    render() {
        this.ctx.strokeStyle = this.currentStroke.color;
        if (this.currentStroke.points.length >= 1) {
            // add to respective chunk coordinates
            // optimizing for line rendering
            const startIndex = this.lastRenderedIndex;
            const startPoint = this.currentStroke.points[startIndex];
            
            if (startPoint) {
                this.ctx.beginPath();
                this.ctx.moveTo(startPoint.x, startPoint.y);
                for (let i = startIndex + 1; i < this.currentStroke.points.length; i++) {
                    const point = this.currentStroke.points[i]!;
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            this.ctx.stroke();
            this.lastRenderedIndex = this.currentStroke.points.length - 1;
        }
    }

    fullBoardRender() {
        // clear out old canvas

        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        this.drawBoardBoundaries();

        this.reRenderStrokes();

    }

    reRenderStrokes(): void {

        this.visibleChunkRange = this.getVisibleChunkRange();
        const {minX, minY, maxX, maxY} = this.visibleChunkRange;
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                const currentChunk: ChunkCoordinate = `${i},${j}`;
                console.log(`Rendering chunk (${i},${j})`); 

                if (currentChunk) {
                    const strokeIds = this.spatialIndex.get(currentChunk);

                    if (!strokeIds) continue;

                    for (const id of strokeIds) {
                        const stroke = this.strokes.get(id);
                        if (!stroke) continue;

                        this.ctx.strokeStyle = stroke.color
                        // since its been pushed to the strokes array, we're certain it has some size
                        // each stroke consists of points. We're now gonna render all of the relevant points on the screen
                        if (!stroke.points) continue;

                        const firstPoint: Point = stroke.points[0]!;

                        this.ctx.beginPath();
                        this.ctx.moveTo(firstPoint.x, firstPoint.y);

                        for (let point of stroke.points) {
                            this.ctx.lineTo(point.x, point.y);
                        }

                        this.ctx.stroke();
                    }
                    
                }
                
            }
        }
    }

    drawBoardBoundaries() {
        const width: number = this.canvas.width;
        const height: number = this.canvas.height;
        this.ctx.strokeStyle = "gray";
        this.ctx.beginPath();

        // vertical boundaries
        for (let x = CHUNK_WIDTH; x < width; x += CHUNK_WIDTH) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
        }

        // horizontal boundaries
        for (let y = CHUNK_HEIGHT; y < height; y += CHUNK_HEIGHT) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
        }

        this.ctx.stroke();
    }
}