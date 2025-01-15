import React, { useEffect, useRef, useState } from 'react';
import { animated } from '@react-spring/web';
import { Camera } from './components/Camera';
import Rectangle from './components/Rectangle';
import { useController } from '../src/Controller';
import UI from './components/UI';
import dayjs from 'dayjs';
import DateLabels from './components/DateLabels';
import './components/styles/Room.css';

function App() {
  const mouseFollowerRef = useRef(null);
  const [locked, setLocked] = useState(true);

  const {
    rectangles,
    setRectangles,
    activeRectangle,
    setActiveRectangle,
    adjustedMousePosition,
    setAdjustedMousePosition,
    gridSize,
    getClientXY,
    createRectangle,
    deactivateRectangle
  } = useController();

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
  } = Camera(getClientXY, locked);

  // Control the date range picker
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(dayjs().add(2, 'day').toDate());

  // Update position on touch/mouse move
  useEffect(() => {
    const handleMoveWrapper = (event) => {
      event.preventDefault();

      const coords = getClientXY(event);
      if (!coords) return;
      const { clientX, clientY } = coords;

      if (mouseFollowerRef.current && centerSectionRef.current) {
        const cameraRect = centerSectionRef.current.getBoundingClientRect();
        mouseFollowerRef.current.style.left = `${clientX - cameraRect.left - 47.5 * zoom}px`;
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
  }, [activeRectangle, rectangles, handleMouseMoveCamera, positionState, setPositionState, zoom, centerSectionRef, getClientXY, setAdjustedMousePosition]);

  // Handle touch/mouse down to start dragging
  useEffect(() => {
    const handleDown = (event) => {
      event.preventDefault();
      // Find the rectangle that matches the event target's class
      const rect = rectangles.find(r => event.target.classList.contains(`rectangle-${r.id}`));
      const UI = event.target.classList.contains('UI') ? event.target : null;

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
      } else if (!UI) {
        handleMouseDownCamera(event, setPositionState);
      }
    };

    window.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('mousedown', handleDown);

    return () => {
      window.removeEventListener('touchstart', handleDown);
      window.removeEventListener('mousedown', handleDown);
    };
  }, [rectangles, handleMouseDownCamera, setPositionState, setActiveRectangle, setRectangles]);

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
  }, [activeRectangle, rectangles, isCameraDragging, handleMouseUpCamera, positionState, setPositionState, setActiveRectangle, setRectangles]);

  // Calculate the height of the center section based on the date range
  useEffect(() => {
    const daysDifference = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
    const heightPerDay = gridSize * 4 * 24;
    const centerSectionHeight = daysDifference * heightPerDay;

    if (centerSectionRef.current) {
      centerSectionRef.current.style.setProperty('--center-section-height', `${centerSectionHeight}px`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerSectionRef, isOpen]);


  return (
    <div className="App">
      <UI createRectangle={createRectangle} mouseFollowerRef={mouseFollowerRef} zoom={zoom} locked={locked} setLocked={setLocked} deactivateRectangle={deactivateRectangle} activeRectangle={activeRectangle}
        startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} isOpen={isOpen} setIsOpen={setIsOpen} />

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

          <DateLabels startDate={startDate} endDate={endDate} gridSize={gridSize} />

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

          {rectangles.filter(rect => !rect.deactivated).map((rect) => (
            <React.Fragment key={rect.id}>
              <Rectangle
                key={rect.id}
                viewportState={viewportState}
                zoom={zoom}
                centerSectionRef={centerSectionRef}
                rect={rect}
                adjustedMousePosition={adjustedMousePosition}
                gridSize={gridSize}
                rectangles={rectangles}
                setRectangles={setRectangles}
                getClientXY={getClientXY}
                isDragging={rect.isDragging}
                color={rect.color}
                size={rect.size}
                icon={rect.icon}
                isNote={rect.isNote}
                deactivated={rect.deactivated}
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
