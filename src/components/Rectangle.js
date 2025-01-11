import React, { useState, useEffect, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';

const Rectangle = ({ viewportState, zoom, centerSectionRef, rect, adjustedMousePosition, gridSize,
    startX, allRectangles, updatedRectangleData, setUpdatedRectangleData, getClientXY, isDragging }) => {

    const [state, setState] = useState(0);
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
        if (updatedRectangleData[id - 1].absolutePosition.x !== startX) return false;

        const thereshold = 5;

        const pos1 = customPos1 !== undefined ? customPos1 : absoluteRectanglePosition.y;
        const hei = customHeight !== undefined ? customHeight : height;

        const top1 = pos1 + thereshold;
        const bot1 = top1 + hei - thereshold;

        const otherRect = updatedRectangleData[id - 1];

        const top2 = otherRect.absolutePosition.y + thereshold;
        const bot2 = top2 + otherRect.height - thereshold;

        return (top1 < top2 && bot1 > top2) || (top1 >= top2 && top1 < bot2);
    }, [absoluteRectanglePosition, height, updatedRectangleData, startX]);

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

    // Handle mouse/touch move for the rectangle to update its position and size
    const handleMouseRectangle = useCallback((event) => {
        event.preventDefault();

        if (state === 0) {
            setState(1);
            event.stopPropagation();

            const { clientX, clientY } = getClientXY(event);
            const currentRectBottom = absoluteRectanglePosition.y + height;
            setInitialDragPosition({ ...absoluteRectanglePosition }); // Store initial drag position

            if (adjustedMousePosition >= currentRectBottom - 15 && adjustedMousePosition <= currentRectBottom) {
                setIsResizing(true);
                document.body.style.cursor = 'ns-resize';
                setPositionState((prev) => ({
                    ...prev,
                    offset: {
                        x: clientX - absoluteRectanglePosition.x,
                        y: clientY - currentRectBottom,
                    },
                }));
            } else {
                document.body.style.cursor = 'grabbing';
                const relativeRectPos = getRelativePosition(absoluteRectanglePosition);
                setPositionState((prev) => ({
                    ...prev,
                    offset: {
                        x: clientX - (relativeRectPos.x - viewportState.cameraPosition.x) * zoom,
                        y: clientY - (relativeRectPos.y - viewportState.cameraPosition.y) * zoom,
                    },
                }));
            }
        } else if (state === 1) {

            if (event.touches && event.touches.length > 1) {
                setState(0);
                return;
            }

            const { clientX, clientY } = getClientXY(event);
            if (!isResizing) {
                const newMousePosition = { x: clientX, y: clientY };
                setPositionState((prev) => ({
                    ...prev,
                    mousePosition: newMousePosition,
                }));
                const newAbsolutePosition = {
                    x: (newMousePosition.x - positionState.offset.x) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.left) - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
                    y: (newMousePosition.y - positionState.offset.y) / zoom - (centerSectionRef.current ? parseFloat(centerSectionRef.current.style.top) - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
                };
                setAbsoluteRectanglePosition(newAbsolutePosition);
            } else {
                const newY = clientY - positionState.offset.y;
                const newHeight = Math.max(20, Math.min(300, Math.round((newY - absoluteRectanglePosition.y) / gridSize) * gridSize));
                var canResize = true;

                if (absoluteRectanglePosition.x === startX) {
                    for (let i = 1; i < allRectangles.length + 1; i++) {
                        if ((allRectangles[i - 1].id !== rect.id) && doesOverlap(i, undefined, newHeight)) {
                            canResize = false;
                            break;
                        }
                    }
                }
                if (canResize) setHeight(newHeight);
            }
        }
    }, [isDragging, centerSectionRef, viewportState, zoom, positionState, isResizing, gridSize, allRectangles, absoluteRectanglePosition, height, doesOverlap, getClientXY, adjustedMousePosition, getRelativePosition, state]);

    // Handle mouse/touch down/up for the rectangle
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseRectangle);
            window.addEventListener('touchmove', handleMouseRectangle, { passive: false });
        } else {
            if (!isResizing) {
                var overlapping = false;

                if (showGhost) {
                    for (let i = 1; i < allRectangles.length + 1; i++) {
                        if ((allRectangles[i - 1].id !== rect.id) && doesOverlap(i, Math.round(absoluteRectanglePosition.y / gridSize) * gridSize)) {
                            overlapping = true;
                            break;
                        }
                    }
                }

                if (showGhost && !overlapping) {
                    const snappedY = centerSectionRef.current ? Math.min(centerSectionRef.current.offsetHeight - height,
                        Math.max(0, Math.round(absoluteRectanglePosition.y / gridSize) * gridSize)) : Math.max(0, Math.round(absoluteRectanglePosition.y / gridSize) * gridSize);
                    setAbsoluteRectanglePosition({ x: viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 75, y: snappedY });
                } else if (showGhost && overlapping) {
                    setAbsoluteRectanglePosition(initialDragPosition);
                }
            }

            setIsResizing(false);
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleMouseRectangle);
            window.removeEventListener('touchmove', handleMouseRectangle);
            setState(0);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseRectangle);
            window.removeEventListener('touchmove', handleMouseRectangle);
        };
    }, [isDragging, initialDragPosition, rect.id]);

    // Show ghost when rectangle is in the center section
    useEffect(() => {
        const centerSectionStart = viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 250;
        const centerSectionEnd = viewportState.cameraPosition.x + viewportState.windowSize.width / 2 + 100;
        if (!isResizing && absoluteRectanglePosition.x > centerSectionStart && absoluteRectanglePosition.x < centerSectionEnd
            && absoluteRectanglePosition.y >= -gridSize * 7 && absoluteRectanglePosition.y <= (centerSectionRef.current ? centerSectionRef.current.offsetHeight - height + 7 * gridSize : 0)) {
            setShowGhost(true);
        } else {
            setShowGhost(false);
        }
    }, [absoluteRectanglePosition, viewportState, isResizing, gridSize, centerSectionRef, height]);

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


    return (
        <div>
            <animated.div
                className={`rectangle rectangle-${rect.id} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
                style={{
                    transform: rectangleProps.x.to((x) => {
                        const relativePos = getRelativePosition({
                            x: rectangleProps.x.get(),
                            y: rectangleProps.y.get(),
                        });
                        return `translate3d(${relativePos.x}px, ${relativePos.y}px, 0) rotate(${(x - absoluteRectanglePosition.x) / 10}deg)`;
                    }),
                    height: rectangleProps.height,
                    position: 'absolute',
                }}
            />

            {isDragging && showGhost && (
                <div className="ghost"
                    style={{
                        left: `${0}px`,
                        top: `${centerSectionRef.current ? Math.min(centerSectionRef.current.offsetHeight - height,
                            Math.max(0, Math.round(absoluteRectanglePosition.y / gridSize) * gridSize)) : 0}px`,
                        position: 'absolute',
                        height: height
                    }}
                />
            )}
        </div >
    );
};

export default Rectangle;