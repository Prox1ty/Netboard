import type { Circle } from "./Circle"
import type { FreeHandDrawing } from "./FreeHandDrawing"
import type { Rectangle } from "./Rectangle"

export type DrawingObject = 
| FreeHandDrawing
| Rectangle
| Circle