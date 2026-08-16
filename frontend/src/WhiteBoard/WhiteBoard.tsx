import React, {useEffect, useRef, useState} from 'react'
import CanvasInstance from '../../../engine/src/Canvas';

function WhiteBoard() {

    const canvasElementRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<CanvasInstance | null>(null);

    useEffect(() => {
        engineRef.current = new CanvasInstance(canvasElementRef.current!);
        // remove listeners IMPLEMENT LATER
        // return () => {
        //     engineRef.current?.destroy();
        // }
    }, []);

    const getCanvasPosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) =>  {
        const {x, y} = getCanvasPosition(event);
        engineRef.current?.mouseDown(x, y, event.button);
    }

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const {x, y} = getCanvasPosition(event);
        engineRef.current?.mouseUp(x, y, event.button);
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const {x, y} = getCanvasPosition(event);
        engineRef.current?.mouseMove(x, y);
    }

    const handleWheel = (event: any) => {
        const {x, y} = getCanvasPosition(event);
        const zoomFactor = event.deltaY < 0
        ? 1.1
        : 1 / 1.1;
        engineRef.current?.screenZoom(x, y, zoomFactor);
        console.log("Scroll event fired");
        
    }

  return (
    <canvas 
        className= 'bg-[var(--bg)] whiteboard-background'
        ref={canvasElementRef}
        tabIndex={0}

        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onKeyDown={(e) => {
        const isModifierPressed = e.ctrlKey || e.metaKey;

        if (isModifierPressed && e.code === 'KeyZ') {
            e.preventDefault(); 
            console.log("Undo fired");
            engineRef.current?.undo();
        } 
        else if (isModifierPressed && e.code === 'KeyY') {
            e.preventDefault();
            console.log("Redo fired");
            engineRef.current?.redo();
        }
        }}
        onWheel={handleWheel}
    ></canvas>
  )
}

export default WhiteBoard