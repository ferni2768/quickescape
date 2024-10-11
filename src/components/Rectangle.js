import { useState, useEffect, useCallback } from 'react';
import { useSpring } from '@react-spring/web';

export function Rectangle(viewportState, zoom, centerSectionRef, rect, adjustedMousePosition, gridSize, startX, allRectangles, updatedRectangleData, setUpdatedRectangleData) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [absoluteRectanglePosition, setAbsoluteRectanglePosition] = useState({
        x: rect.x,
        y: rect.y,
    });

    const [initialDragPosition, setInitialDragPosition] = useState({
        x: rect.x,
        y: rect.y,
    });

    const [height, setHeight] = useState(rect.height || 50);
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

    // Utility to check if two rectangles overlap
    const doesOverlap = useCallback((id, customPos1, customHeight) => {
        if (updatedRectangleData[id - 1].absolutePosition.x != startX) return false;

        const pos1 = customPos1 !== undefined ? customPos1 : absoluteRectanglePosition.y;
        const hei = customHeight !== undefined ? customHeight : height;

        const top1 = pos1 + 1;
        const bot1 = top1 + hei - 1;

        const otherRect = updatedRectangleData[id - 1];

        const top2 = otherRect.absolutePosition.y + 1;
        const bot2 = top2 + otherRect.height - 1;

        return (top1 < top2 && bot1 > top2) || (top1 >= top2 && top1 < bot2);
    }, [absoluteRectanglePosition, height, updatedRectangleData]);

    // Update rectangle data when dragging or resizing
    useEffect(() => {
        setUpdatedRectangleData((prevPositions) =>
            prevPositions.map((r) =>
                r.id === rect.id ? { ...r, absolutePosition: absoluteRectanglePosition, height: height } : r
            )
        );
    }, [absoluteRectanglePosition, height, rect.id, setUpdatedRectangleData]);

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
            const newHeight = Math.max(20, Math.min(300, Math.round((newY - absoluteRectanglePosition.y) / gridSize) * gridSize));
            var canResize = true;

            if (absoluteRectanglePosition.x === startX) {
                for (let i = 1; i < allRectangles.length + 1; i++) {
                    if ((allRectangles[i - 1].id != rect.id) && doesOverlap(i, undefined, newHeight)) {
                        setHeight(height);
                        canResize = false;
                        break;
                    }
                }
            }
            if (canResize) setHeight(newHeight);
        }
    }, [isDragging, centerSectionRef, viewportState, zoom, positionState, isResizing, gridSize, allRectangles, absoluteRectanglePosition, height, doesOverlap]);

    // Handle mouse down for the rectangle to start dragging or resizing
    const handleMouseDownRectangle = useCallback((event) => {
        const currentRectBottom = absoluteRectanglePosition.y + height;
        setInitialDragPosition({ ...absoluteRectanglePosition });  // Store initial drag position

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
        if (isDragging) {
            var overlapping = false;

            if (showGhost) {
                for (let i = 1; i < allRectangles.length + 1; i++) {
                    if ((allRectangles[i - 1].id != rect.id) && doesOverlap(i, Math.round(absoluteRectanglePosition.y / gridSize) * gridSize)) {
                        setAbsoluteRectanglePosition(initialDragPosition);
                        overlapping = true;
                        break;
                    }
                }
            }

            if (showGhost && !overlapping) {
                const snappedY = Math.round(absoluteRectanglePosition.y / gridSize) * gridSize;
                setAbsoluteRectanglePosition({ x: viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 75, y: snappedY });
            } else if (overlapping) {
                setAbsoluteRectanglePosition(initialDragPosition);
            }

        }
        setIsDragging(false);
        setIsResizing(false);
        document.body.style.cursor = 'default';
    }, [showGhost, absoluteRectanglePosition, viewportState, gridSize, doesOverlap, allRectangles]);

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
