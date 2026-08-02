import React, {useEffect, useRef, useState} from 'react'
import CanvasInstance from '../../../engine/src/Objects/Canvas';

function WhiteBoard() {

    const canvasElementRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<CanvasInstance | null>(null);

    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    const bottomSentinelRef = useRef(null);
    const rightSentinelRef = useRef(null);
    const boardContainerRef = useRef(null);

    useEffect(() => {
        const observerOptions = {
            root: boardContainerRef.current, 
            threshold: 0.1 // triggers as soon as 10% of the sentinel is visible
        }

        const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            if (entry.target === bottomSentinelRef.current) {
                // add 1000px to height
                setDimensions((prev) => ({...prev, height: prev.height + 1000}));
            }
            if (entry.target === rightSentinelRef.current) {
                // add 1000px to width
                setDimensions((prev) => ({...prev, width: prev.width + 1000}));
            }
        });
    }, observerOptions);

    // track both edges
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);
    if (rightSentinelRef.current) observer.observe(rightSentinelRef.current);

    return () => observer.disconnect();
    }, []);

    


    useEffect(() => {
        if (!canvasElementRef.current) return;
        
        engineRef.current = new CanvasInstance(canvasElementRef.current);

        // remove listeners IMPLEMENT LATER
        // return () => {
        //     engineRef.current?.destroy();
        // }
    }, []);

    useEffect(() => {
        engineRef.current?.fullBoardRender();
    }, [dimensions])

    const getCanvasPosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) =>  {
        const {x, y} = getCanvasPosition(event);
        engineRef.current?.mouseDown(x, y);
    }

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const {x, y} = getCanvasPosition(event);
        engineRef.current?.mouseUp(x, y);
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const {x, y} = getCanvasPosition(event);
        engineRef.current?.mouseMove(x, y);
    }

  return (
    <div
        ref={boardContainerRef}
        className="whiteboard-scroll whiteboard-background relative h-screen w-screen overflow-auto"
        style={{
            width: `${dimensions.width}`,
            height: `${dimensions.height}`
        }}
    >
    <canvas 
        className= 'bg-[var(--bg)]'
        ref={canvasElementRef}

        width={dimensions.width}
        height={dimensions.height}

        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    ></canvas>
    <div
        ref={rightSentinelRef}
        className="absolute top-0 h-5 w-5 pointer-events-none"
        style={{
            left: `${dimensions.width - 5}px`
        }}
    />

    <div
        ref={bottomSentinelRef}
        className="absolute left-0 h-5 w-5 pointer-events-none"
        style={{
            top: `${dimensions.height - 5}px`
        }}
    />
    </div>
  )
}

export default WhiteBoard