import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { animated } from '@react-spring/web';
import { Camera } from './components/Camera';
import Rectangle from './components/Rectangle';
import { useController } from '../src/Controller';
import { RECTANGLE_SIZES } from './Controller';
import UI from './components/UI';
import dayjs from 'dayjs';
import DateLabels from './components/DateLabels';
import './components/styles/Room.css';

// Memoized UI component
const MemoizedUI = React.memo(UI, (prevProps, nextProps) => (
  prevProps.zoom === nextProps.zoom &&
  prevProps.locked === nextProps.locked &&
  prevProps.visible === nextProps.visible &&
  prevProps.isOpen === nextProps.isOpen &&
  prevProps.activeRectangle === nextProps.activeRectangle &&
  prevProps.overTrashcanId === nextProps.overTrashcanId &&
  prevProps.startDate?.getTime() === nextProps.startDate?.getTime() &&
  prevProps.endDate?.getTime() === nextProps.endDate?.getTime()
));

// Memoized Rectangle component
const MemoizedRectangle = React.memo(Rectangle);

function App() {
  const mouseFollowerRef = useRef(null);
  const appRef = useRef(null);
  const buttonContainerRef = useRef();
  const [locked, setLocked] = useState(true);
  const [visible, setVisible] = useState(true);
  const [overTrashcanId, setOverTrashcanId] = useState(null);

  const {
    rectangles,
    setRectangles,
    activeRectangle,
    setActiveRectangle,
    adjustedMousePosition,
    setAdjustedMousePosition,
    gridSize,
    getClientXY,
    createRectangle
  } = useController();

  const cameraDeps = useMemo(() => ({ getClientXY, locked, visible }), [getClientXY, locked, visible]);
  const {
    viewportState,
    centerSectionRef,
    handleMouseMoveCamera,
    handleMouseDownCamera,
    handleTouchEnd,
    cameraProps,
    zoomProps,
    zoom,
    zooming,
    refresh
  } = Camera(cameraDeps.getClientXY, cameraDeps.locked, cameraDeps.visible, buttonContainerRef);

  // Date range state
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: dayjs().add(2, 'day').toDate()
  });

  // Memoized setStartDate and setEndDate
  const setStartDate = useCallback((date) => setDateRange(prev => ({ ...prev, start: date })), []);
  const setEndDate = useCallback((date) => setDateRange(prev => ({ ...prev, end: date })), []);

  // Memoized app dimensions handler
  const setAppDimensions = useCallback(() => {
    if (appRef.current) {
      appRef.current.style.height = `${window.innerHeight}px`;
      appRef.current.style.width = `${window.innerWidth}px`;
    }
  }, []);

  useEffect(() => {
    setAppDimensions();
    const handleResizeOrOrientationChange = () => setAppDimensions();

    window.addEventListener('resize', handleResizeOrOrientationChange);
    window.addEventListener('orientationchange', handleResizeOrOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResizeOrOrientationChange);
      window.removeEventListener('orientationchange', handleResizeOrOrientationChange);
    };
  }, [setAppDimensions]);

  // Function to check if rectangle is snapped
  const isSnapped = useCallback((rect) => {
    return rect.x === centerSectionRef.current.style.x - (RECTANGLE_SIZES[rect.size]) / 2;
  }, [centerSectionRef]);

  // Function to check if rectangle has adjacent rectangles
  const checkAdjacentBorders = useCallback((targetRect) => {
    if (targetRect.isNote) return;
    setRectangles(prev => prev.map(rect => {
      let newBorder = rect.border;

      const topNeighbor = prev.find(r =>
        r.id !== rect.id &&
        isSnapped(r) &&
        r.size <= rect.size &&
        Math.abs(r.y + r.height - rect.y) < gridSize / 2
      );
      const bottomNeighbor = prev.find(r =>
        r.id !== rect.id &&
        isSnapped(r) &&
        r.size <= rect.size &&
        Math.abs(rect.y + rect.height - r.y) < gridSize / 2
      );

      // For the target rectangle
      if (rect.id === targetRect.id) {
        newBorder = (topNeighbor ? 1 : 0) + (bottomNeighbor ? 2 : 0);
      } else {
        if (bottomNeighbor) newBorder |= 2;
        if (topNeighbor) newBorder |= 1;
      }

      return newBorder !== rect.border ? { ...rect, border: newBorder } : rect;
    }));
  }, [gridSize, setRectangles, isSnapped]);

  // Memoized move handler
  const handleMoveWrapper = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const coords = getClientXY(event);
    if (!coords) return;
    const { clientX, clientY } = coords;

    if (mouseFollowerRef.current && centerSectionRef.current) {
      const cameraRect = centerSectionRef.current.getBoundingClientRect();
      mouseFollowerRef.current.style.left = `${clientX - cameraRect.left - 47.5 * zoom}px`;
      mouseFollowerRef.current.style.top = `${clientY - cameraRect.top}px`;

      setAdjustedMousePosition({
        x: (clientX - cameraRect.left) / zoom,
        y: (clientY - cameraRect.top) / zoom
      });
    }

    if (activeRectangle !== null) {
      const instance = rectangles.find(rect => rect.id === activeRectangle);
      if (instance?.isDragging || instance?.isResizing) {
        instance.isDragging = true;
      }
    } else {
      handleMouseMoveCamera(event);
    }
  }, [zoom, activeRectangle, rectangles, centerSectionRef, getClientXY, handleMouseMoveCamera, setAdjustedMousePosition]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMoveWrapper);
    window.addEventListener('touchmove', handleMoveWrapper, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMoveWrapper);
      window.removeEventListener('touchmove', handleMoveWrapper);
    };
  }, [handleMoveWrapper]);

  // Memoized down handler
  const handleDown = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if the event target is part of the DatePicker or find a rectangle
    if (event.target.closest('.react-datepicker')) return;
    const rect = rectangles.find(r => event.target.classList.contains(`rectangle-${r.id}`));
    const UI = event.target.classList.contains('UI') ? event.target : null;

    const { clientX, clientY } = getClientXY(event);

    if (mouseFollowerRef.current && centerSectionRef.current) {
      const cameraRect = centerSectionRef.current.getBoundingClientRect();
      mouseFollowerRef.current.style.left = `${clientX - cameraRect.left - 47.5 * zoom}px`;
      mouseFollowerRef.current.style.top = `${clientY - cameraRect.top}px`;

      setAdjustedMousePosition({
        x: (clientX - cameraRect.left) / zoom,
        y: (clientY - cameraRect.top) / zoom
      });
    }

    if ((rect && !event.touches) || (rect && event.touches && event.touches.length === 1)) {
      setActiveRectangle(rect.id);

      setRectangles(prevRectangles => {
        let updated = prevRectangles.map(r => {
          if (r.id === rect.id) return { ...r, border: 0, isDragging: true };

          // Check if it was a previous neighbor
          const wasTopNeighbor = Math.abs(r.y + r.height - rect.y) < gridSize / 2;
          const wasBottomNeighbor = Math.abs(rect.y + rect.height - r.y) < gridSize / 2;

          // Clear neighbor borders if they were adjacent
          if (!r.isNote && isSnapped(r)) {
            let newBorder = r.border;
            if (wasTopNeighbor) newBorder &= ~2;
            if (wasBottomNeighbor) newBorder &= ~1;
            return { ...r, border: newBorder };
          }
          return r;
        });

        // Move the active rectangle to the end to update the z-index
        const currentRectIndex = updated.findIndex(r => r.id === rect.id);
        if (currentRectIndex !== -1) {
          const [currentRect] = updated.splice(currentRectIndex, 1);
          updated.push(currentRect);
        }

        return updated;
      });
    } else {
      const rect = rectangles.find(r => r.id === activeRectangle);
      if (rect) {
        setRectangles(prevRectangles => prevRectangles.map(instance => ({ ...instance, isDragging: false })));
        setTimeout(() => {
          if (rect) {
            const currentRect = rectangles.find(r => r.id === rect.id);
            checkAdjacentBorders(currentRect);
          }
        }, 250);
        setActiveRectangle(null);
      }

      if (!UI && !isOpen) handleMouseDownCamera(event);
    }
  }, [rectangles, handleMouseDownCamera, setActiveRectangle, setRectangles, isOpen, getClientXY, centerSectionRef, zoom, setAdjustedMousePosition, gridSize, isSnapped, activeRectangle, checkAdjacentBorders]);

  useEffect(() => {
    window.addEventListener('touchstart', handleDown, { passive: false });
    window.addEventListener('mousedown', handleDown);

    return () => {
      window.removeEventListener('touchstart', handleDown);
      window.removeEventListener('mousedown', handleDown);
    };
  }, [handleDown]);

  // Memoized mouse up handler
  const handleUp = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = rectangles.find(r => r.id === activeRectangle);

    setTimeout(() => {
      setRectangles(prev => prev.map(rect =>
        rect.isDragging ? { ...rect, isDragging: false } : rect
      ));
      setActiveRectangle(null);
    }, 5);

    setTimeout(() => {
      if (rect) {
        const currentRect = rectangles.find(r => r.id === rect.id);
        checkAdjacentBorders(currentRect);
      }
    }, 250);

    document.body.style.cursor = 'default';
    handleTouchEnd();
  }, [activeRectangle, handleTouchEnd, setActiveRectangle, setRectangles, rectangles, checkAdjacentBorders]);

  useEffect(() => {
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
  }, [handleUp]);

  // Memoized center section height calculation
  const centerSectionHeight = useMemo(() => {
    const daysDifference = dayjs(dateRange.end).diff(dayjs(dateRange.start), 'day') + 1;
    return daysDifference * gridSize * 4 * 24;
  }, [dateRange.start, dateRange.end, gridSize]);

  useEffect(() => {
    if (centerSectionRef.current)
      centerSectionRef.current.style.setProperty('--center-section-height', `${centerSectionHeight}px`);
  }, [centerSectionHeight, centerSectionRef]);

  // Memoized UI props
  const uiProps = useMemo(() => ({
    createRectangle,
    mouseFollowerRef,
    buttonContainerRef,
    zoom,
    locked,
    setLocked,
    visible,
    setVisible,
    activeRectangle,
    setOverTrashcanId,
    startDate: dateRange.start,
    endDate: dateRange.end,
    setStartDate,
    setEndDate,
    isOpen,
    setIsOpen
  }), [createRectangle, zoom, locked, visible, isOpen, dateRange.start, dateRange.end, activeRectangle, setStartDate, setEndDate, setLocked, setVisible, setOverTrashcanId]);


  return (
    <div className="App" ref={appRef}>
      <MemoizedUI {...uiProps} />

      <animated.div
        className="room"
        style={{
          transform: zoomProps.zoom.to((z) => `scale(${z})`),
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        <animated.div
          className="camera"
          style={{
            transform: cameraProps.x.to((x, y) => `translate(${-x}px, ${-cameraProps.y.get()}px)`),
            position: 'relative',
            pointerEvents: 'none',
          }}
        >
          <DateLabels startDate={dateRange.start} endDate={dateRange.end} gridSize={gridSize} />

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
            <MemoizedRectangle
              key={rect.id}
              viewportState={viewportState}
              zoom={zoom}
              zooming={zooming}
              centerSectionRef={centerSectionRef}
              mouseFollowerRef={mouseFollowerRef}
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
              refresh={refresh}
              isOverTrashcan={overTrashcanId === rect.id}
            />
          ))}

          {/* To keep track of the position of the mouse in a window with zoom equal to 1 */}
          <div ref={mouseFollowerRef} style={{ position: 'absolute', pointerEvents: 'none' }} />
        </animated.div>
      </animated.div>
    </div>
  );
}

export default React.memo(App);