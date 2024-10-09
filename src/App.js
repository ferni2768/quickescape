import React, { useEffect, useCallback, useState } from 'react';
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
    isCameraDragging,
    positionState,
    setPositionState
  } = Camera();

  // Multiple rectangles with independent states
  const [rectangles,] = useState([
    { id: 1, x: -300, y: 0 },
    { id: 2, x: -100, y: 100 },
    { id: 3, x: 100, y: -100 },
    { id: 4, x: 300, y: 0 },
  ]);

  const [activeRectangle, setActiveRectangle] = useState(null);

  // Map each rectangle to an independent Rectangle instance
  const rectangleInstances = rectangles.map((rect) => Rectangle(viewportState, zoom, centerSectionRef, rect));

  // Update mouse position on mouse move
  useEffect(() => {
    const handleMouseMoveWrapper = (event) => {
      if (activeRectangle !== null) {
        const instance = rectangleInstances[activeRectangle];
        if (instance.isDragging) {
          instance.handleMouseMoveRectangle(event);
        } else {
          handleMouseMoveCamera(event, positionState, setPositionState, zoom);
        }
      } else {
        handleMouseMoveCamera(event, positionState, setPositionState, zoom);
      }
    };

    window.addEventListener('mousemove', handleMouseMoveWrapper);
    return () => { window.removeEventListener('mousemove', handleMouseMoveWrapper); };
  }, [activeRectangle, rectangleInstances, handleMouseMoveCamera, positionState, setPositionState, zoom]);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((event) => {
    event.preventDefault();
    const rectIndex = rectangles.findIndex(r => event.target.classList.contains(`rectangle-${r.id}`));
    if (rectIndex !== -1) {
      setActiveRectangle(rectIndex);
      rectangleInstances[rectIndex].handleMouseDownRectangle(event);
    } else {
      handleMouseDownCamera(event, setPositionState);
    }
  }, [rectangleInstances, rectangles, handleMouseDownCamera, setPositionState]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback((event) => {
    event.preventDefault();
    if (activeRectangle !== null) {
      const instance = rectangleInstances[activeRectangle];
      if (instance.isDragging) {
        instance.handleMouseUpRectangle();
      }
      setActiveRectangle(null);
    } else if (isCameraDragging) {
      handleMouseUpCamera(positionState, setPositionState);
    }
  }, [activeRectangle, rectangleInstances, isCameraDragging, handleMouseUpCamera, positionState, setPositionState]);

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

          {rectangles.map((rect, index) => (
            <animated.div
              key={rect.id}
              className={`rectangle rectangle-${rect.id} ${rectangleInstances[index].isDragging ? 'dragging' : ''}`}
              style={{
                transform: rectangleInstances[index].rectangleProps.x.to((x) => {
                  const relativePos = rectangleInstances[index].getRelativePosition({
                    x: rectangleInstances[index].rectangleProps.x.get(),
                    y: rectangleInstances[index].rectangleProps.y.get(),
                  });
                  return `translate3d(${relativePos.x}px, ${relativePos.y}px, 0) rotate(${(x - rectangleInstances[index].absoluteRectanglePosition.x) / 10}deg)`;
                }),
                position: 'absolute',
              }}
            />
          ))}

          {activeRectangle !== null && rectangleInstances[activeRectangle].showGhost && (
            <div
              className="ghost"
              style={{
                left: `${0}px`,
                top: `${Math.round(rectangleInstances[activeRectangle].getRelativePosition(rectangleInstances[activeRectangle].absoluteRectanglePosition).y / 100) * 100}px`,
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