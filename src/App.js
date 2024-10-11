import React, { useEffect, useState, useRef } from 'react';
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
  } = Camera(getClientXY);

  // Multiple rectangles with independent states
  const [rectangles,] = useState([
    { id: 1, x: -75, y: 0, height: 50 },
    { id: 2, x: -75, y: 100, height: 50 },
    { id: 3, x: -350, y: 200, height: 100 },
    { id: 4, x: -75, y: 0, height: 80 },
  ]);

  const [updatedRectangleData, setUpdatedRectangleData] = useState(
    rectangles.map(rect => ({
      id: rect.id,
      absolutePosition: { x: rect.x, y: rect.y },
      height: rect.height,
    }))
  );

  const gridSize = 25;
  const startX = -75;

  const [activeRectangle, setActiveRectangle] = useState(null);
  const mouseFollowerRef = useRef(null);
  const [adjustedMousePosition, setAdjustedMousePosition] = useState(0);

  const rectangleInstances = rectangles.map((rect) =>
    Rectangle(
      viewportState,
      zoom,
      centerSectionRef,
      rect,
      adjustedMousePosition,
      gridSize,
      startX,
      rectangles,
      updatedRectangleData,
      setUpdatedRectangleData,
      getClientXY
    )
  );

  // Helper function to get clientX and clientY
  function getClientXY(event) {
    if (event.touches && event.touches.length > 0) {
      return {
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY,
      };
    } else if (event.clientX !== undefined && event.clientY !== undefined) {
      return {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    } else {
      return null;
    }
  }

  // Update position on touch/mouse move
  useEffect(() => {
    const handleMoveWrapper = (event) => {
      event.preventDefault();

      const coords = getClientXY(event);
      if (!coords) return;
      const { clientX, clientY } = coords;

      if (mouseFollowerRef.current && centerSectionRef.current) {
        const cameraRect = centerSectionRef.current.getBoundingClientRect();
        mouseFollowerRef.current.style.left = `${clientX - cameraRect.left}px`;
        mouseFollowerRef.current.style.top = `${clientY - cameraRect.top}px`;

        // Calculate adjusted position
        const adjustedY = (clientY - cameraRect.top) / zoom;
        setAdjustedMousePosition(adjustedY);
      }

      if (activeRectangle !== null) {
        const instance = rectangleInstances[activeRectangle];
        if (instance.isDragging || instance.isResizing) {
          instance.handleMouseMoveRectangle(event);
        } else {
          handleMouseMoveCamera(event, positionState, setPositionState, zoom);
        }
      } else {
        handleMouseMoveCamera(event, positionState, setPositionState, zoom);
      }
    };

    // Attach both mousemove and touchmove events
    window.addEventListener('mousemove', handleMoveWrapper);
    window.addEventListener('touchmove', handleMoveWrapper, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMoveWrapper);
      window.removeEventListener('touchmove', handleMoveWrapper);
    };
  }, [activeRectangle, rectangleInstances, handleMouseMoveCamera, positionState, setPositionState, zoom, centerSectionRef]);

  // Handle touch/mouse down to start dragging
  useEffect(() => {
    const handleDown = (event) => {
      event.preventDefault();
      const rectIndex = rectangles.findIndex(r => event.target.classList.contains(`rectangle-${r.id}`));
      if (rectIndex !== -1) {
        setActiveRectangle(rectIndex);
        rectangleInstances[rectIndex].handleMouseDownRectangle(event);
      } else {
        handleMouseDownCamera(event, setPositionState);
      }
    };

    window.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('mousedown', handleDown);

    return () => {
      window.removeEventListener('touchstart', handleDown);
      window.removeEventListener('mousedown', handleDown);
    };
  }, [rectangleInstances, rectangles, handleMouseDownCamera, setPositionState]);

  // Handle touch/mouse up to stop dragging
  useEffect(() => {
    const handleUp = (event) => {
      event.preventDefault();
      if (activeRectangle !== null) {
        const instance = rectangleInstances[activeRectangle];
        if (instance.isDragging || instance.isResizing) {
          instance.handleMouseUpRectangle();
        }
        setActiveRectangle(null);
      } else if (isCameraDragging) {
        handleMouseUpCamera(positionState, setPositionState);
      }
    };

    window.addEventListener('touchend', handleUp, { passive: false });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchcancel', handleUp, { passive: false });
    window.addEventListener('mouseleave', handleUp);

    return () => {
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchcancel', handleUp);
      window.removeEventListener('mouseleave', handleUp);
    };
  }, [activeRectangle, rectangleInstances, isCameraDragging, handleMouseUpCamera, positionState, setPositionState]);

  return (
    <div className="App">
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
            <React.Fragment key={rect.id}>
              <animated.div
                className={`rectangle rectangle-${rect.id} ${rectangleInstances[index].isDragging ? 'dragging' : ''} ${rectangleInstances[index].isResizing ? 'resizing' : ''}`}
                style={{
                  transform: rectangleInstances[index].rectangleProps.x.to((x) => {
                    const relativePos = rectangleInstances[index].getRelativePosition({
                      x: rectangleInstances[index].rectangleProps.x.get(),
                      y: rectangleInstances[index].rectangleProps.y.get(),
                    });
                    return `translate3d(${relativePos.x}px, ${relativePos.y}px, 0) rotate(${(x - rectangleInstances[index].absoluteRectanglePosition.x) / 10}deg)`;
                  }),
                  height: rectangleInstances[index].rectangleProps.height,
                  position: 'absolute',
                }}
              />
            </React.Fragment>
          ))}

          {activeRectangle !== null && rectangleInstances[activeRectangle].showGhost && (
            <div
              className="ghost"
              style={{
                left: `${0}px`,
                top: `${centerSectionRef.current ? Math.min(centerSectionRef.current.offsetHeight - rectangleInstances[activeRectangle].rectangleProps.height.get(),
                  Math.max(0, Math.round(rectangleInstances[activeRectangle].getRelativePosition(rectangleInstances[activeRectangle].absoluteRectanglePosition).y / gridSize) * gridSize)) : 0}px`,
                position: 'absolute',
                height: rectangleInstances[activeRectangle].rectangleProps.height.get()
              }}
            />
          )}

          {/* To keep track of the position of the mouse in a window with zoom equal to 1 */}
          <div ref={mouseFollowerRef} style={{ position: 'absolute', pointerEvents: 'none' }} />

        </animated.div>
      </animated.div>
    </div>
  );
}

export default App;
