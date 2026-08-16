import { Point } from "./types";

export default class Camera {
    x: number;
    y: number;
    zoom: number;

    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
    }

    convertWorldToScreen(point: Point): Point {
        return {
            x: (point.x - this.x) * this.zoom,
            y: (point.y - this.y) * this.zoom
        }
    }


    // we need this to convert relative coordinates (relative to the camera) to absolute (world) coordinates
    convertScreenToWorld(point: Point): Point {
        return {
            x: point.x  / this.zoom + this.x,
            y: point.y / this.zoom + this.y 
        }
    }

    zoomAt(screenX: number, screenY: number, zoomFactor: number) {
        // convert mouse coords (in screen space) to world coords
        const worldPoint = this.convertScreenToWorld({x: screenX, y: screenY});
        const MAX_ZOOM = 5;
        const MIN_ZOOM = 0.1;

        this.zoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, this.zoom * zoomFactor)
    );

        // calculate the resultant camera position after zoom. 
        this.x = worldPoint.x - screenX / this.zoom;
        this.y = worldPoint.y - screenY / this.zoom;
    }

}