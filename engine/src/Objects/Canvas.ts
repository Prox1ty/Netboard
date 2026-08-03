import Point from "./Point";
import {CHUNK_WIDTH, CHUNK_HEIGHT} from "../constants/index"

export default class CanvasInstance {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private g_strokeState: Record<number, Point[][]>;
    private strokes: Point[][] = [];
    private currentStroke: Point[] = [];
    public currentStrokeClr = "red";

    private lastRenderedIndex: number;

    private isRenderPending: boolean = false;
    private readonly MIN_POINT_DISTANCE: number = 3;

    constructor(canvasEl: HTMLCanvasElement) {
        this.canvas = canvasEl;
        this.ctx = this.canvas.getContext('2d')!;
        this.lastRenderedIndex = 0;

        if (!this.ctx) {
            throw new Error('2D context unavailable');
        }

        this.drawBoardBoundaries();
    }

    validPoint(x: number, y: number) : boolean {
        if (this.currentStroke.length <= 0) return false;

        // allow undefined to get rid of annoying strict check
        const lastPoint: Point | undefined = this.currentStroke[this.currentStroke.length - 1];

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
        this.currentStroke = []; // reset currentStroke array.
        this.currentStroke.push(new Point(x, y));
        this.lastRenderedIndex = this.currentStroke.length - 1;
    }



    mouseMove(x: number, y: number) : void {
        if (this.validPoint(x, y)) {
            this.currentStroke.push(new Point(x, y));
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
        this.currentStroke.push(new Point(x, y));
        this.render();

        this.strokes.push(this.currentStroke);

        this.currentStroke = [];
        this.lastRenderedIndex = 0;
        this.isRenderPending = false;
    }

    render() {
        this.ctx.strokeStyle = this.currentStrokeClr;
        if (this.currentStroke.length >= 1) {
            const startIndex = this.lastRenderedIndex;
            const startPoint = this.currentStroke[startIndex];
            
            if (startPoint) {
                this.ctx.beginPath();
                this.ctx.moveTo(startPoint.x, startPoint.y);
                
                for (let i = startIndex + 1; i < this.currentStroke.length; i++) {
                    const point = this.currentStroke[i]!;
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            this.ctx.stroke();
            this.lastRenderedIndex = this.currentStroke.length - 1;
        }
    }

    fullBoardRender() {
        this.drawBoardBoundaries();

        this.ctx.strokeStyle = this.currentStrokeClr;
        if (this.strokes.length >= 1) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (let stroke of this.strokes) {
                const firstPoint: Point = stroke[0]!;
                this.ctx.beginPath();
                this.ctx.moveTo(firstPoint.x, firstPoint.y);
                for (let point of stroke) {
                    this.ctx.lineTo(point.x, point.y);
                }
                this.ctx.stroke();
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