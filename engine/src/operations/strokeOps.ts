import { Stroke } from "../types";

function createNewStroke(id: number, clr: string, x: number, y: number) : Stroke {
    return {
        id: id,
        color: clr,
        points: [{x, y}],
        createdAt: Date.now()
    }
}



export {createNewStroke}