import { useState, useEffect, useCallback } from 'react';
import { useSpring } from '@react-spring/web';

export function Rectangle(viewportState, zoom, centerSectionRef) {
    const [isDragging, setIsDragging] = useState(false);
    const [absoluteRectanglePosition, setAbsoluteRectanglePosition] = useState({ x: -75, y: 0 });
    const [showGhost, setShowGhost] = useState(false);

    const rectangleProps = useSpring({
        x: absoluteRectanglePosition.x,
        y: absoluteRectanglePosition.y,
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

    // Handle mouse move to drag the rectangle
    const handleMouseMoveRectangle = useCallback((event, positionState, setPositionState, zoom) => {
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
        }
    }, [isDragging, centerSectionRef, viewportState, zoom]);

    // Handle mouse down for the rectangle to start dragging
    const handleMouseDownRectangle = useCallback((event, setPositionState) => {
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
    }, [getRelativePosition, absoluteRectanglePosition, viewportState, zoom]);

    // Handle mouse up for the rectangle to stop dragging
    const handleMouseUpRectangle = useCallback(() => {
        setIsDragging(false);
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
        absoluteRectanglePosition,
        isDragging
    };
}
