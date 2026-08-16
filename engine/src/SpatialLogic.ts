import type { VisibleChunkRange } from "./types";
import type { ChunkCoordinate } from "./Canvas";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "./constants";
import Camera from "./Camera";

function getChunkCoordinate(x: number, y: number): [number, number] {
    return [
        Math.floor(x / CHUNK_WIDTH),
        Math.floor(y / CHUNK_HEIGHT)
    ];
}

function getVisibleChunkRange(camera: Camera, canvas: HTMLCanvasElement): VisibleChunkRange {
    const top = camera.y;
    const left = camera.x;
    const right = left + canvas.width / camera.zoom;
    const bottom = top + canvas.height / camera.zoom;
            

    const [minX, minY] : number[] = getChunkCoordinate(left, top);
    const [maxX, maxY]: number[] = getChunkCoordinate(right, bottom);

    return { 
        minY,
        maxY,
        minX,
        maxX
    };
}

// returns key 
function getChunkKey(x: number, y: number): ChunkCoordinate {
    const chunkX = Math.floor(x / CHUNK_WIDTH);
    const chunkY = Math.floor(y / CHUNK_HEIGHT);

    return `${chunkX},${chunkY}`;
}




export { getChunkCoordinate,  getVisibleChunkRange,  getChunkKey}