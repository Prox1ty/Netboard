import type Point from "./Point"

export default interface Stroke {
    id: number,
    createdAt: number,
    color: string,
    thickness: number,
    points: Point[]
}