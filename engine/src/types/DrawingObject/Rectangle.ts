import Point from "../Point";

export interface Rectangle {
    id: number;
    type: "Rectangle";

    point: Point
    width: number;
    height: number;

    color: string;
    thickness?: string;
}