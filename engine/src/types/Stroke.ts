import Point from "./Point"

export default interface Stroke {
    id: number,
    createdAt: number,
    color: string,
    points: Point[]
}