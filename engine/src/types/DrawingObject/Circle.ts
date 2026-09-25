import Point from "../Point";

export interface Circle {
    id: number;
    type: "Circle";

    start: Point;
    end: Point;

    color: string;
    thickness?: number;
}