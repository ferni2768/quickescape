import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export const RECTANGLE_SIZES = { 1: 325, 2: 275, 3: 200 };
export const RECTANGLE_BORDER_RADIUS = '2ch';

export const useController = () => {
    const [rectangles, setRectangles] = useState([]);
    const rectanglesRef = useRef(rectangles);
    const [activeRectangle, setActiveRectangle] = useState(null);
    const [adjustedMousePosition, setAdjustedMousePosition] = useState({ x: 0, y: 0 });
    const gridSize = 20;
    const maxRectangles = 150;

    // Unique ID counter for rectangles
    const idCounter = useRef(0);

    // Memoized function to get client X and Y coordinates
    const getClientXY = useCallback((event) => {
        if (event.touches && event.touches.length > 0) {
            return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
        }
        return { clientX: event.clientX, clientY: event.clientY };
    }, []);

    // Track the rectangles array
    useEffect(() => {
        rectanglesRef.current = rectangles;
    }, [rectangles]);

    // Memoized function to create a new rectangle
    const createRectangle = useCallback((x, y, height, color, size, icon, group) => {
        if (rectanglesRef.current.length >= maxRectangles) return;
        const newRectangle = {
            id: idCounter.current++,
            x,
            y,
            height,
            border: 0,
            isDragging: true,
            isResizing: false,
            showGhost: false,
            color,
            size,
            icon,
            isNote: group === 0
        };
        setRectangles((prev) => [...prev, newRectangle]);
        setActiveRectangle(newRectangle.id);
    }, []);

    // Memoized controller object to prevent unnecessary re-renders
    const controller = useMemo(() => ({
        rectangles,
        setRectangles,
        activeRectangle,
        setActiveRectangle,
        adjustedMousePosition,
        setAdjustedMousePosition,
        gridSize,
        getClientXY,
        createRectangle
    }), [rectangles, activeRectangle, adjustedMousePosition, gridSize, getClientXY, createRectangle]);

    return controller;
};