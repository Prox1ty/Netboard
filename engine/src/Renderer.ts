import Camera from './Camera';
import { ChunkCoordinate } from './Canvas';
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "./constants";
import { getVisibleChunkRange } from "./SpatialLogic";
import { VisibleChunkRange, Stroke, Point } from "./types";

export default class CanvasRenderer {
    private ctx;
    private lastRenderedIndex: number;

    constructor(context: CanvasRenderingContext2D) {
        this.ctx = context;
        this.lastRenderedIndex = 0; // start from the first index.
    }

    clear(canvas: HTMLCanvasElement) {
        this.ctx.resetTransform();
        this.ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    beginStroke(lastIdx: number) {
        this.lastRenderedIndex = lastIdx;
    }

    endStroke() {
        this.lastRenderedIndex = 0;
    }

    renderStroke(stroke: Stroke) {
        this.ctx.strokeStyle = stroke.color;
        if (stroke.points.length >= 1) {
            // add to respective chunk coordinates
            // optimizing for line rendering
            const startIndex = this.lastRenderedIndex;
            const startPoint = stroke.points[startIndex];
            
            if (startPoint) {
                this.ctx.beginPath();
                this.ctx.moveTo(startPoint.x, startPoint.y);
                for (let i = startIndex + 1; i < stroke.points.length; i++) {
                    const point = stroke.points[i]!;
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            this.ctx.stroke();
            this.lastRenderedIndex = stroke.points.length - 1;
        }

    }

    drawBoardBoundaries(
    camera: Camera,
    canvas: HTMLCanvasElement
    ) {
        const left = camera.x;
        const top = camera.y;
        const right = left + canvas.width / camera.zoom;
        const bottom = top + canvas.height / camera.zoom;

        const startX = Math.floor(left / CHUNK_WIDTH) * CHUNK_WIDTH;
        const startY = Math.floor(top / CHUNK_HEIGHT) * CHUNK_HEIGHT;
        
        this.ctx.strokeStyle= "gray";
        this.ctx.beginPath();

        for (let x = startX; x <= right; x += CHUNK_WIDTH) {
            this.ctx.moveTo(x, top);
            this.ctx.lineTo(x, bottom);
        }

        for (let y = startY; y <= bottom; y += CHUNK_HEIGHT) {
            this.ctx.moveTo(left, y);
            this.ctx.lineTo(right, y);
        }

        this.ctx.stroke();
    }

    reRenderStrokes(spatialIndex: Map<ChunkCoordinate, 
        Set<number>>, 
        strokes: Map<number, Stroke>,
        visibleChunkRange: VisibleChunkRange,
        activeStrokeIds: number[],
    ): void {

        

        // minor performance optimization
        const renderedStrokes = new Set<number>();
        // currently active strokes in history
        const activeIds = new Set(activeStrokeIds);

        const {minX, minY, maxX, maxY} = visibleChunkRange;
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                const currentChunk: ChunkCoordinate = `${i},${j}`;
                console.log(`Rendering chunk (${i},${j})`); 

                if (currentChunk) {
                    const strokeIds = spatialIndex.get(currentChunk);

                    if (!strokeIds) continue;

                    for (const id of strokeIds) {
                        // skip if the stroke isn't active
                        if (!activeIds.has(id)) {
                            continue;
                        }

                        // prevent duplicate rendering
                        if (renderedStrokes.has(id)) {
                            continue;
                        }

                        const stroke = strokes.get(id);
                        if (!stroke) continue;

                        renderedStrokes.add(id);

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

    

}