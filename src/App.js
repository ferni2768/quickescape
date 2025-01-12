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

  // State to manage rectangles
  const [rectangles, setRectangles] = useState([]);
  const [activeRectangle, setActiveRectangle] = useState(null);
  const [adjustedMousePosition, setAdjustedMousePosition] = useState(0);

  const gridSize = 25;
  const startX = -75;
  const mouseFollowerRef = useRef(null);

  // Handle key press to create a new rectangle
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 'b') {
        const newRectangle = {
          id: rectangles.length + 1,
          x: -100,
          y: -100,
          height: 50,
          isDragging: false,
          isResizing: false,
          showGhost: false,
        };

        setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [rectangles]);

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
    }
    return null;
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
        const instance = rectangles[activeRectangle];
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
  }, [activeRectangle, rectangles, handleMouseMoveCamera, positionState, setPositionState, zoom, centerSectionRef]);

  // Handle touch/mouse down to start dragging
  useEffect(() => {
    const handleDown = (event) => {
      event.preventDefault();
      // Find the rectangle that matches the event target's class
      const rect = rectangles.find(r => event.target.classList.contains(`rectangle-${r.id}`));
      if (rect) {
        const rectIndex = rectangles.findIndex(instance => instance.id === rect.id);
        if (rectIndex !== -1) {
          setActiveRectangle(rectIndex);
          setRectangles(prevRectangles => {
            const newRectangles = [...prevRectangles];
            newRectangles[rectIndex].isDragging = true;
            return newRectangles;
          });
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
  }, [rectangles, handleMouseDownCamera, setPositionState]);

  // Handle touch/mouse up to stop dragging
  useEffect(() => {
    const handleUp = (event) => {
      event.preventDefault();
      if (activeRectangle !== null) {
        setRectangles(prevRectangles => {
          const newRectangles = [...prevRectangles];
          newRectangles[activeRectangle].isDragging = false;
          return newRectangles;
        });
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
  }, [activeRectangle, rectangles, isCameraDragging, handleMouseUpCamera, positionState, setPositionState]);


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
                rectangles={rectangles}
                setRectangles={setRectangles}
                getClientXY={getClientXY}
                isDragging={rect.isDragging}
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