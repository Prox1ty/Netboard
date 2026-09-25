import type Point from "../Point";

export interface FreeHandDrawing {
    id: number;
    type: "FreeHandDrawing"   
    points: Point[]

    color: string;
    thickness?: number;
}
