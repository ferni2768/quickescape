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
  const [, setIsScrolling] = useState(false);
  const centerTimeoutRef = useRef(null);
  const centerSectionRef = useRef(null);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setViewportState((prev) => ({
        ...prev,
        windowSize: { width: newWidth, height: newHeight },
        cameraPosition: {
          x: newWidth / 2,
          y: newHeight / 2,
        },
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get the relative position of an absolute position for the rectangle
  const getRelativePosition = useCallback(
    (absolutePos) => ({
      x: viewportState.cameraPosition.x + absolutePos.x + (centerSectionRef.current ? centerSectionRef.current.style.x - viewportState.cameraPosition.x : viewportState.windowSize.width / 2),
      y: viewportState.cameraPosition.y + absolutePos.y + (centerSectionRef.current ? centerSectionRef.current.style.y - viewportState.cameraPosition.y : viewportState.windowSize.height / 2),
    }),
    [viewportState]
  );

  // Update mouse position on mouse move
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isDragging) {
        const newMousePosition = { x: event.clientX, y: event.clientY };
        setPositionState((prev) => ({
          ...prev,
          mousePosition: newMousePosition,
        }));
        const newAbsolutePosition = {
          x: (newMousePosition.x - positionState.offset.x) / zoom - viewportState.windowSize.width / 2,
          y: (newMousePosition.y - positionState.offset.y) / zoom - viewportState.windowSize.height / 2,
        };
        setAbsoluteRectanglePosition(newAbsolutePosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, positionState.offset, zoom, viewportState]);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((event) => {
    event.preventDefault();
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
  }, [absoluteRectanglePosition, getRelativePosition, viewportState.cameraPosition, zoom]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
    document.body.style.cursor = 'default';
    if (showGhost) {
      const snappedY = Math.round(absoluteRectanglePosition.y / 100) * 100;
      setAbsoluteRectanglePosition({ x: viewportState.cameraPosition.x + viewportState.windowSize.width / 2 - 75, y: snappedY });
    }
  }, [absoluteRectanglePosition.y, showGhost, viewportState]);

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

  // Move and center camera
  const handleWheel = useCallback((event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY * -0.01;
      handleZoom(delta);
    } else {
      setIsScrolling(true);
      setViewportState((prev) => ({
        ...prev,
        cameraPosition: {
          x: prev.cameraPosition.x - event.deltaX / zoom,
          y: prev.cameraPosition.y - event.deltaY / zoom,
        },
      }));

      // Clear any existing timeout
      if (centerTimeoutRef.current) {
        clearTimeout(centerTimeoutRef.current);
      }

      // Set a new timeout to center the camera
      centerTimeoutRef.current = setTimeout(() => {
        setViewportState((prev) => ({
          ...prev,
          cameraPosition: {
            x: -prev.windowSize.width / 2,
            y: -prev.windowSize.height / 2,
          },
        }));
        setIsScrolling(false);
      }, 100);
    }
  }, [handleZoom, zoom]);

  // Clean up the timeout on component unmount
  useEffect(() => {
    return () => {
      if (centerTimeoutRef.current) {
        clearTimeout(centerTimeoutRef.current);
      }
    };
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

  // Utility function to format numbers with different number of decimal
  const formatNumber = (value) => +parseFloat(value).toFixed(0);

  useEffect(() => {
    setPositionState((prev) => ({
      ...prev,
      rectanglePosition: {
        x: getRelativePosition(absoluteRectanglePosition).x * zoom - viewportState.cameraPosition.x,
        y: getRelativePosition(absoluteRectanglePosition).y * zoom - viewportState.cameraPosition.y,
      },
    }));
  }, [absoluteRectanglePosition, zoom, viewportState.cameraPosition]);

  return (
    <div className="App" onMouseUp={handleMouseUp} onWheel={handleWheel}>

      {/* Debug Information Display */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        fontSize: '16px',
        color: 'black',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000,
      }}>
        <div>Mouse Position: {`x: ${formatNumber(positionState.mousePosition.x)}, y: ${formatNumber(positionState.mousePosition.y)}`}</div>
        <div>Rectangle Position: {`x: ${formatNumber(getRelativePosition(absoluteRectanglePosition).x)}, y: ${formatNumber(getRelativePosition(absoluteRectanglePosition).y)}`}</div>
        <div>Rectangle Absolute Position: {`x: ${formatNumber(absoluteRectanglePosition.x)}, y: ${formatNumber(absoluteRectanglePosition.y)}`}</div>
        <div>Window Size: {`width: ${formatNumber(viewportState.windowSize.width)}, height: ${formatNumber(viewportState.windowSize.height)}`}</div>
        <div>Camera Position: {`x: ${formatNumber(viewportState.cameraPosition.x)}, y: ${formatNumber(viewportState.cameraPosition.y)}`}</div>
        <div>Zoom: {zoom}</div>
      </div>

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
              transform: `translate(-50%, -50%)`,
              position: 'absolute',
            }}
          />

          <div style={{
            position: 'fixed',
            top: absoluteRectanglePosition.y,
            left: absoluteRectanglePosition.x,
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'grey',
            zIndex: 1000,
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
            onMouseDown={handleMouseDown}
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

      {/* Red circles fixed to the corners of the viewport */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'red',
      }}
      />
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'red',
      }}
      />
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'red',
      }}
      />
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'red',
      }}
      />
    </div>
  );
}

export default App;