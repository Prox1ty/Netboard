import type { VisibleChunkRange } from "./types";
import type { ChunkCoordinate } from "./Canvas";
import { CHUNK_HEIGHT, CHUNK_WIDTH } from "./constants";

function getChunkCoordinate(x: number, y: number): [number, number] {
    return [
        Math.floor(x / CHUNK_WIDTH),
        Math.floor(y / CHUNK_HEIGHT)
    ];
}

function getVisibleChunkRange(container: HTMLDivElement): VisibleChunkRange {
    const top = container.scrollTop;
    const left = container.scrollLeft;
    const right = left + container.clientWidth;
    const bottom = top + container.clientHeight;
            

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