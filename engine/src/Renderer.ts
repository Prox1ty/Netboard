import { ChunkCoordinate } from './Canvas';
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "./constants";
import { getVisibleChunkRange } from "./SpatialLogic";
import { VisibleChunkRange, Stroke, Point } from "./types";

export default class CanvasRenderer {
    private ctx;
    private container;
    private lastRenderedIndex: number;

    constructor(context: CanvasRenderingContext2D, container: HTMLDivElement) {
        this.ctx = context;
        this.container = container;
        this.lastRenderedIndex = 0; // start from the first index.
    }

    clear(canvas: HTMLCanvasElement) {
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

    drawBoardBoundaries(canvas: HTMLCanvasElement) {
        const width: number = canvas.width;
        const height: number = canvas.height;
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

    reRenderStrokes(spatialIndex: Map<ChunkCoordinate, 
        Set<number>>, 
        strokes: Map<number, Stroke>,
        activeStrokeIds: number[]
    ): void {

        const visibleChunkRange: VisibleChunkRange = getVisibleChunkRange(this.container);

        const renderedStrokes = new Set<number>();
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