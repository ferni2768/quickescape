import React, { useEffect, useState, useRef } from 'react';
import { animated } from '@react-spring/web';
import './App.css';
import { Camera } from './components/Camera';
import Rectangle from './components/Rectangle';

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
  const [rectangles, setRectangles] = useState([
    { id: 1, x: -75, y: 0, height: 50 },
    { id: 2, x: -75, y: 100, height: 50 },
    { id: 3, x: -350, y: 200, height: 100 },
    { id: 4, x: 140, y: 150, height: 80 },
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

  const rectangleInstances = useRef(
    rectangles.map((rect) => ({
      id: rect.id,
      isDragging: false,
      isResizing: false,
      showGhost: false,
      rectangleProps: {
        height: {
          get: () => rect.height,
        },
      },
      getRelativePosition: (position) => position,
      absoluteRectanglePosition: { x: rect.x, y: rect.y },
    }))
  ).current;

  // Handle key press to create a new rectangle
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'b' || event.key === 'B') {
        const newRectangle = {
          id: rectangles.length + 1,
          x: -100,
          y: -100,
          height: 50,
        };

        setRectangles(prevRectangles => [
          ...prevRectangles,
          newRectangle
        ]);

        rectangleInstances.push({
          id: newRectangle.id,
          isDragging: false,
          isResizing: false,
          showGhost: false,
          rectangleProps: {
            height: {
              get: () => newRectangle.height,
            },
          },
          getRelativePosition: (position) => position,
          absoluteRectanglePosition: { x: newRectangle.x, y: newRectangle.y },
        });

        setUpdatedRectangleData(prevData => [
          ...prevData,
          {
            id: newRectangle.id,
            absolutePosition: { x: newRectangle.x, y: newRectangle.y },
            height: newRectangle.height,
          }
        ]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [rectangles, rectangleInstances, setUpdatedRectangleData]);

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
          instance.isDragging = true;
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
      // Find the rectangle that matches the event target's class
      const rect = rectangles.find(r => event.target.classList.contains(`rectangle-${r.id}`));
      if (rect) {
        const rectIndex = rectangleInstances.findIndex(instance => instance.id === rect.id);
        if (rectIndex !== -1) {
          setActiveRectangle(rectIndex);
          rectangleInstances[rectIndex].isDragging = true;
        }
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
          instance.isDragging = false;
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

          {rectangles.map((rect) => (
            <React.Fragment key={rect.id}>
              <Rectangle
                key={rect.id}
                viewportState={viewportState}
                zoom={zoom}
                centerSectionRef={centerSectionRef}
                rect={rect}
                adjustedMousePosition={adjustedMousePosition}
                gridSize={gridSize}
                startX={startX}
                allRectangles={rectangles}
                updatedRectangleData={updatedRectangleData}
                setUpdatedRectangleData={setUpdatedRectangleData}
                getClientXY={getClientXY}
                isDragging={rectangleInstances.find(r => r.id === rect.id).isDragging}
              />
            </React.Fragment>
          ))}

          {/* To keep track of the position of the mouse in a window with zoom equal to 1 */}
          <div ref={mouseFollowerRef} style={{ position: 'absolute', pointerEvents: 'none' }} />

        </animated.div>
      </animated.div>
    </div>
  );
}

export default App;
