import { useState, useEffect, useCallback } from 'react';

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

    // Handle key press to create a new rectangle
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key.toLowerCase() === 'b') {
                const newRectangle = {
                    id: rectangles.length + 1,
                    x: -100,
                    y: -100,
                    height: 50,
                    isDragging: false,
                    isResizing: false,
                    showGhost: false,
                };

                setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [rectangles]);


    return {
        rectangles,
        setRectangles,
        activeRectangle,
        setActiveRectangle,
        adjustedMousePosition,
        setAdjustedMousePosition,
        gridSize,
        getClientXY
    };
};