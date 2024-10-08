import React, { useState, useEffect, useCallback } from 'react';
import { animated } from '@react-spring/web';
import './App.css';
import { Camera } from './components/Camera';
import { Rectangle } from './components/Rectangle';

function App() {

  const {
    viewportState,
    centerSectionRef,
    handleMouseMoveCamera,
    handleMouseDownCamera,
    handleMouseUpCamera,
    cameraProps,
    zoomProps,
    zoom,
    isCameraDragging
  } = Camera();

  const {
    rectangleProps,
    positionState,
    setPositionState,
    handleMouseDownRectangle,
    handleMouseUpRectangle,
    handleMouseMoveRectangle,
    isDragging,
    showGhost,
    absoluteRectanglePosition,
    getRelativePosition,
  } = Rectangle(viewportState, zoom, centerSectionRef);


  // Update mouse position on mouse move
  useEffect(() => {
    const handleMouseMoveWrapper = (event) => {
      if (isDragging) {
        handleMouseMoveRectangle(event, positionState, setPositionState, zoom);
      } else { handleMouseMoveCamera(event, positionState, setPositionState, zoom); }
    };

    window.addEventListener('mousemove', handleMouseMoveWrapper);
    return () => { window.removeEventListener('mousemove', handleMouseMoveWrapper); };
  }, [isDragging, handleMouseMoveRectangle, handleMouseMoveCamera, positionState.offset, zoom, viewportState, centerSectionRef]);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((event) => {
    event.preventDefault();
    if (event.target.classList.contains('rectangle')) {
      handleMouseDownRectangle(event, setPositionState);
    } else { handleMouseDownCamera(event, setPositionState); }
  }, [absoluteRectanglePosition, viewportState.cameraPosition, zoom, handleMouseDownCamera, handleMouseDownRectangle]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback((event) => {
    event.preventDefault();
    if (isDragging) {
      handleMouseUpRectangle();
    } else if (isCameraDragging) {
      // Center the camera after dragging
      handleMouseUpCamera();
    }
  }, [isDragging, isCameraDragging, showGhost, absoluteRectanglePosition.y, viewportState]);


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