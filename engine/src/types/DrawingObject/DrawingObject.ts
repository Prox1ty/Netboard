import { Circle } from "./Circle"
import { FreeHandDrawing } from "./FreeHandDrawing"
import { Rectangle } from "./Rectangle"

export type DrawingObject = 
| FreeHandDrawing
| Rectangle
| Circle