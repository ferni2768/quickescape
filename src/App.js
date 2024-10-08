import React, { useState, useEffect, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './App.css';
import { useCamera } from './hooks/useCamera';

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [absoluteRectanglePosition, setAbsoluteRectanglePosition] = useState({ x: -75, y: 0 });
  const [showGhost, setShowGhost] = useState(false);

  const [positionState, setPositionState] = useState({
    mousePosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const {
    viewportState,
    centerSectionRef,
    handleMouseMove,
    handleMouseDownCamera,
    handleMouseUpCamera,
    cameraProps,
    zoomProps,
    zoom,
    isCameraDragging
  } = useCamera();

  const rectangleProps = useSpring({
    x: absoluteRectanglePosition.x,
    y: absoluteRectanglePosition.y,
    config: { mass: 1, tension: 170, friction: 26 },
  });

  const getRelativePosition = useCallback(
    (absolutePos) => ({
      x: viewportState.cameraPosition.x + absolutePos.x + (centerSectionRef.current ? centerSectionRef.current.style.x - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
      y: viewportState.cameraPosition.y + absolutePos.y + (centerSectionRef.current ? centerSectionRef.current.style.y - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
    }),
    [viewportState, centerSectionRef]
  );

  // Update mouse position on mouse move
  useEffect(() => {
    const handleMouseMoveWrapper = (event) => {
      if (isDragging) {
        // Dragging the rectangle
        const newMousePosition = { x: event.clientX, y: event.clientY };
        setPositionState((prev) => ({
          ...prev,
          mousePosition: newMousePosition,
        }));
        const newAbsolutePosition = {
          x: (newMousePosition.x - positionState.offset.x) / zoom - (centerSectionRef.current ? centerSectionRef.current.style.x - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
          y: (newMousePosition.y - positionState.offset.y) / zoom - (centerSectionRef.current ? centerSectionRef.current.style.y - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
        };
        setAbsoluteRectanglePosition(newAbsolutePosition);
      } else {
        handleMouseMove(event, positionState, setPositionState, zoom);
      }
    };

    window.addEventListener('mousemove', handleMouseMoveWrapper);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveWrapper);
    };
  }, [isDragging, handleMouseMove, positionState, zoom, viewportState, centerSectionRef]);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((event) => {
    event.preventDefault();
    if (event.target.classList.contains('rectangle')) {
      // Dragging rectangle
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
    } else {
      // Arrastrar la cámara
      handleMouseDownCamera(event, setPositionState);
    }
  }, [absoluteRectanglePosition, getRelativePosition, viewportState.cameraPosition, zoom, handleMouseDownCamera]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback((event) => {
    event.preventDefault();
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = 'default';
      if (showGhost) {
        const snappedY = Math.round(absoluteRectanglePosition.y / 100) * 100;
        setAbsoluteRectanglePosition({ x: viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 75, y: snappedY });
      }
    } else if (isCameraDragging) {
      // Center the camera after dragging
      handleMouseUpCamera();
    }
  }, [isDragging, isCameraDragging, showGhost, absoluteRectanglePosition.y, viewportState]);

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

  return (
    <div className="App" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

      <animated.div
        className="room"
        style={{
          transform: zoomProps.zoom.to((z) => `scale(${z})`),
          position: 'relative',
        }}
      >
        <animated.div
          className="camera"
          style={{
            transform: cameraProps.x.to((x, y) => `translate(${-x}px, ${-cameraProps.y.get()}px)`),
            position: 'relative',
          }}
        >
          <div
            className="center-section"
            ref={centerSectionRef}
            style={{
              left: 0,
              top: 0,
              transform: `translate(-50%, 0%)`,
              position: 'absolute',
            }}
          />

          <animated.div
            className={`rectangle ${isDragging ? 'dragging' : ''}`}
            style={{
              transform: rectangleProps.x.to((x) => {
                const relativePos = getRelativePosition({ x: rectangleProps.x.get(), y: rectangleProps.y.get() });
                return `translate3d(${relativePos.x}px, ${relativePos.y}px, 0) rotate(${(x - absoluteRectanglePosition.x) / 10}deg)`;
              }),
              position: 'absolute',
            }}
          />

          {showGhost && (
            <div
              className="ghost"
              style={{
                left: `${0}px`,
                top: `${Math.round(getRelativePosition(absoluteRectanglePosition).y / 100) * 100}px`,
                position: 'absolute',
              }}
            />
          )}
        </animated.div>
      </animated.div>
    </div>
  );
}

export default App;