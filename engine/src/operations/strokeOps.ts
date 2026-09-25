import type { Stroke } from "../types";

function createNewStroke(id: number, clr: string, x: number, y: number, thickness: number = 1) : Stroke {
    return {
        id: id,
        color: clr,
        thickness,
        points: [{x, y}],
        createdAt: Date.now()
    }
}



export {createNewStroke}