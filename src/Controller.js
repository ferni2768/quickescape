import { useState, useCallback } from 'react';

export const useController = () => {
    const [rectangles, setRectangles] = useState([]);
    const [activeRectangle, setActiveRectangle] = useState(null);
    const [adjustedMousePosition, setAdjustedMousePosition] = useState({ x: 0, y: 0 });
    const [gridSize,] = useState(20);

    // Function to get client X and Y coordinates
    const getClientXY = useCallback((event) => {
        if (event.touches && event.touches.length > 0) {
            return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
        }
        return { clientX: event.clientX, clientY: event.clientY };
    }, []);

    // Function to create a new rectangle
    const createRectangle = (x, y, height) => {
        const newRectangle = {
            id: rectangles.length + 1,
            x: x,
            y: y,
            height: height,
            isDragging: true,
            isResizing: false,
            showGhost: false,
        };
        setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
        setActiveRectangle(newRectangle.id - 1);
    };


    return {
        rectangles,
        setRectangles,
        activeRectangle,
        setActiveRectangle,
        adjustedMousePosition,
        setAdjustedMousePosition,
        gridSize,
        getClientXY,
        createRectangle
    };
};