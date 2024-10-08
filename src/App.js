import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './App.css';

function App() {

  const [positionState, setPositionState] = useState({
    mousePosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const [viewportState, setViewportState] = useState({
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    cameraPosition: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
  });

  const [isDragging, setIsDragging] = useState(false);
  const [absoluteRectanglePosition, setAbsoluteRectanglePosition] = useState({ x: -75, y: 0 });
  const [showGhost, setShowGhost] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isCameraDragging, setIsCameraDragging] = useState(false);
  const centerSectionRef = useRef(null);

  // Auxiliar function to center the camera
  const centerCamera = useCallback(() => {
    setViewportState((prev) => {
      const centerSectionTop = centerSectionRef.current?.offsetTop - prev.windowSize.height / 5 || 0;
      const centerSectionBottom = centerSectionTop + (centerSectionRef.current?.offsetHeight || 0) + prev.windowSize.height / 5;

      let newY = prev.cameraPosition.y;

      if (prev.cameraPosition.y < centerSectionTop - prev.windowSize.height / 4) {
        newY = centerSectionTop - prev.windowSize.height / 4;
      } else if (prev.cameraPosition.y > centerSectionBottom - prev.windowSize.height / 2) {
        newY = centerSectionBottom - prev.windowSize.height / 2;
      }

      return {
        ...prev,
        cameraPosition: {
          x: -prev.windowSize.width / 2,
          y: newY,
        },
      };
    });
  }, []);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      setViewportState((prev) => ({
        ...prev,
        windowSize: { width: newWidth, height: newHeight },
      }));

      setIsCameraDragging(false);
      document.body.style.cursor = 'default';

      // Center the camera after resizing the window
      centerCamera();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerCamera]);

  // Get the relative position of an absolute position for the rectangle
  const getRelativePosition = useCallback(
    (absolutePos) => ({
      x: viewportState.cameraPosition.x + absolutePos.x + (centerSectionRef.current ? centerSectionRef.current.style.x - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
      y: viewportState.cameraPosition.y + absolutePos.y + (centerSectionRef.current ? centerSectionRef.current.style.y - viewportState.cameraPosition.y : viewportState.windowSize.height / 2)
    }),
    [viewportState]
  );

  // Update mouse position on mouse move
  useEffect(() => {
    const handleMouseMove = (event) => {
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
      } else if (isCameraDragging) {
        // Dragging the camera
        setViewportState((prev) => ({
          ...prev,
          cameraPosition: {
            x: prev.cameraPosition.x - (event.clientX - positionState.offset.x) / zoom,
            y: prev.cameraPosition.y - (event.clientY - positionState.offset.y) / zoom,
          },
        }));
        setPositionState((prev) => ({
          ...prev,
          offset: { x: event.clientX, y: event.clientY },
        }));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, isCameraDragging, positionState.offset, zoom, viewportState]);

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
      // Dragging camera
      setIsCameraDragging(true);
      document.body.style.cursor = 'grabbing';
      setPositionState((prev) => ({
        ...prev,
        offset: { x: event.clientX, y: event.clientY },
      }));
    }
  }, [absoluteRectanglePosition, getRelativePosition, viewportState.cameraPosition, zoom]);

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
      setIsCameraDragging(false);
      document.body.style.cursor = 'default';

      // Center the camera after dragging
      centerCamera();
    }
  }, [isDragging, isCameraDragging, showGhost, absoluteRectanglePosition.y, viewportState, centerCamera]);

  // Spring animation for the rectangle
  const rectangleProps = useSpring({
    x: absoluteRectanglePosition.x,
    y: absoluteRectanglePosition.y,
    config: { mass: 1, tension: 170, friction: 26 },
  });

  // Spring animation for the camera
  const cameraProps = useSpring({
    to: { x: viewportState.cameraPosition.x, y: viewportState.cameraPosition.y },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  // Check if rectangle is over the snapping section
  useEffect(() => {
    const centerSectionStart = viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 250;
    const centerSectionEnd = viewportState.cameraPosition.x + viewportState.windowSize.width / 2 + 100;
    if (absoluteRectanglePosition.x > centerSectionStart && absoluteRectanglePosition.x < centerSectionEnd) {
      setShowGhost(true);
    } else {
      setShowGhost(false);
    }
  }, [absoluteRectanglePosition, viewportState]);

  // Handle zooming
  const handleZoom = useCallback((delta) => {
    setZoom((prevZoom) => Math.max(0.1, Math.min(prevZoom + delta, 5)));
  }, []);

  // Handle keyboard events for Ctrl++/Ctrl+- zooming
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          handleZoom(0.1);
        } else if (event.key === '-') {
          event.preventDefault();
          handleZoom(-0.1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoom]);

  // Spring animation for zooming
  const zoomProps = useSpring({ zoom });

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