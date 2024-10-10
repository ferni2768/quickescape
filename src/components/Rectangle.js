import { useState, useEffect, useCallback } from 'react';
import { useSpring } from '@react-spring/web';

export function Rectangle(viewportState, zoom, centerSectionRef, initialPosition, adjustedMousePosition) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [absoluteRectanglePosition, setAbsoluteRectanglePosition] = useState({
        x: initialPosition.x,
        y: initialPosition.y,
    });

    const [height, setHeight] = useState(initialPosition.height || 50);
    const [showGhost, setShowGhost] = useState(false);

    const rectangleProps = useSpring({
        x: absoluteRectanglePosition.x,
        y: absoluteRectanglePosition.y,
        height: height,
        config: { mass: 1, tension: 170, friction: 26 },
    });

    const [positionState, setPositionState] = useState({
        mousePosition: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
    });

    // Get the relative position of an absolute position for the rectangle
    const getRelativePosition = useCallback(
        (absolutePos) => {
            const centerX = centerSectionRef.current ? parseFloat(centerSectionRef.current.style.left) : viewportState.windowSize.width / 2;
            const centerY = centerSectionRef.current ? parseFloat(centerSectionRef.current.style.top) : viewportState.windowSize.height / 2;
            return {
                x: viewportState.cameraPosition.x + absolutePos.x + centerX - viewportState.cameraPosition.x,
                y: viewportState.cameraPosition.y + absolutePos.y + centerY - viewportState.cameraPosition.y,
            };
        },
        [viewportState, centerSectionRef]
    );

    // Handle mouse move for the rectangle to update its position
    const handleMouseMoveRectangle = useCallback((event) => {
        if (isDragging) {
            const newMousePosition = { x: event.clientX, y: event.clientY };
            setPositionState((prev) => ({
                ...prev,
                mousePosition: newMousePosition,
            }));
            const newAbsolutePosition = {
                x: (newMousePosition.x - positionState.offset.x) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.left) - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
                y: (newMousePosition.y - positionState.offset.y) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.top) - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
            };
            setAbsoluteRectanglePosition(newAbsolutePosition);
        } else if (isResizing) {
            const newY = event.clientY - positionState.offset.y;
            const newHeight = Math.max(20, Math.min(300, newY - absoluteRectanglePosition.y));
            setHeight(newHeight);
        }
    }, [isDragging, centerSectionRef, viewportState, zoom, positionState, isResizing]);

    // Handle mouse down for the rectangle to start dragging or resizing
    const handleMouseDownRectangle = useCallback((event) => {
        const currentRectBottom = absoluteRectanglePosition.y + height;

        if (adjustedMousePosition >= currentRectBottom - 15 && adjustedMousePosition <= currentRectBottom) {
            setIsResizing(true);
            document.body.style.cursor = 'ns-resize';
            setPositionState((prev) => ({
                ...prev,
                offset: {
                    x: event.clientX - absoluteRectanglePosition.x,
                    y: event.clientY - currentRectBottom,
                },
            }));
        } else {
            setIsDragging(true);
            document.body.style.cursor = 'grabbing';
            const relativeRectPos = getRelativePosition(absoluteRectanglePosition);
            setPositionState((prev) => ({
                ...prev,
                offset: {
                    x: event.clientX - (relativeRectPos.x - viewportState.cameraPosition.x) * zoom,
                    y: event.clientY - (relativeRectPos.y - viewportState.cameraPosition.y) * zoom,
                },
            }));
        }
    }, [getRelativePosition, absoluteRectanglePosition, viewportState, zoom, height, adjustedMousePosition]);

    // Handle mouse up for the rectangle to stop dragging
    const handleMouseUpRectangle = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        document.body.style.cursor = 'default';
        if (showGhost) {
            const snappedY = Math.round(absoluteRectanglePosition.y / 100) * 100;
            setAbsoluteRectanglePosition({ x: viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 75, y: snappedY });
        }
    }, [showGhost, absoluteRectanglePosition, viewportState]);

    // Show ghost when rectangle is in the center section
    useEffect(() => {
        const centerSectionStart = viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 250;
        const centerSectionEnd = viewportState.cameraPosition.x + viewportState.windowSize.width / 2 + 100;
        if (absoluteRectanglePosition.x > centerSectionStart && absoluteRectanglePosition.x < centerSectionEnd) {
            setShowGhost(true);
        } else {
            setShowGhost(false);
        }
    }, [absoluteRectanglePosition, viewportState]);

    // Update rectangle position when zooming
    useEffect(() => {
        setPositionState((prev) => ({
            ...prev,
            rectanglePosition: {
                x: getRelativePosition(absoluteRectanglePosition).x * zoom - viewportState.cameraPosition.x,
                y: getRelativePosition(absoluteRectanglePosition).y * zoom - viewportState.cameraPosition.y,
            },
        }));
    }, [absoluteRectanglePosition, zoom, viewportState.cameraPosition, getRelativePosition]);

    return {
        rectangleProps,
        positionState,
        setPositionState,
        handleMouseDownRectangle,
        handleMouseUpRectangle,
        handleMouseMoveRectangle,
        getRelativePosition,
        showGhost,
        isDragging,
        isResizing,
        absoluteRectanglePosition,
        height
    };
}
