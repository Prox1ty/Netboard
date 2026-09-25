import Camera from './Camera';
import { ChunkCoordinate } from './Canvas';
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "./constants";
import { getVisibleChunkRange } from "./SpatialLogic";
import { VisibleChunkRange, Stroke, Point } from "./types";
import { Circle, FreeHandDrawing, Rectangle } from './types/DrawingObject';
import { DrawingObject } from './types/DrawingObject/DrawingObject';

function throttle<T extends (...args: any[]) => void>(
    func: T, 
    limit: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();

    if (now - lastCall >= limit) {
        lastCall = now;
        func.apply(this, args);
    }
    };
}

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
        drawings: Map<number, DrawingObject>,
        visibleChunkRange: VisibleChunkRange,
        activeStrokeIds: number[],
    ): void {

        

        // minor performance optimization
        const renderedDrawings = new Set<number>();
        // currently active strokes in history
        const activeIds = new Set(activeStrokeIds);

        const {minX, minY, maxX, maxY} = visibleChunkRange;
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                const currentChunk: ChunkCoordinate = `${i},${j}`;
                console.log(`Rendering chunk (${i},${j})`); 

                if (currentChunk) {
                     const drawingIds = spatialIndex.get(currentChunk);

                    if (!drawingIds) continue;

                    for (const id of drawingIds) {
                        // skip if the stroke isn't active
                        if (!activeIds.has(id)) {
                            continue;
                        }

                        // prevent duplicate rendering
                        if (renderedDrawings.has(id)) {
                            continue;
                        }

                        const drawing = drawings.get(id);
                        if (!drawing) continue;

                        renderedDrawings.add(id);
                        
                        switch(drawing.type) {

                            case "FreeHandDrawing":
                                this.renderFreeHandDrawing(drawing);
                                break;
                            case "Rectangle":
                                this.renderRect(drawing);
                                break;
                            case "Circle":
                                this.renderCircle(drawing);
                                break;
                        }
                        
                    }
                    
                }
                
            }
        }
    }

    renderFreeHandDrawing(drawing: FreeHandDrawing) {
        this.ctx.strokeStyle = drawing.color;
        // since its been pushed to the strokes array, we're certain it has some size
        // each stroke consists of points. We're now gonna render all of the relevant points on the screen
        if (!drawing?.points) return;

        const firstPoint: Point = drawing?.points[0]!;

        this.ctx.beginPath();
        this.ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let point of drawing?.points) {
            this.ctx.lineTo(point.x, point.y);
        }

        this.ctx.stroke();
    }

    renderRect(rectangle: Rectangle) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = rectangle.color;
        
        this.ctx.rect(
            rectangle.point.x,
            rectangle.point.y,
            rectangle.width,
            rectangle.height
        );

        this.ctx.stroke();
    }

    renderCircle(circle: Circle) {
        const left = Math.min(circle.start.x, circle.end.x);
        const top = Math.min(circle.start.y, circle.end.y);
        const width = Math.abs(circle.end.x - circle.start.x);
        const height = Math.abs(circle.end.y - circle.start.y);

        this.ctx.beginPath();
        this.ctx.strokeStyle = circle.color;
        this.ctx.ellipse(
            left + width / 2,
            top + height / 2,
            width / 2,
            height / 2,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();
    }



    throttledRender = throttle(this.renderRect, 10);
    throttledCircleRender = throttle(this.renderCircle, 10);

}