import type Point from "./Point";

export default interface Selection {
    point: Point,
    width: number,
    height: number,
}