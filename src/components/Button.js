import React from 'react';
import '../App.css';

const Button = ({ id, text, color, size, createRectangle, zoom, mouseFollowerRef, icon, group }) => {
    const handleButtonClick = () => {
        // Calculate the position relative to the room
        const { offsetLeft, offsetTop } = mouseFollowerRef.current;
        createRectangle((offsetLeft - 75 * zoom) / zoom, (offsetTop - 25 * zoom) / zoom, 50, color, size, icon, group);
    };

    return (
        <button
            id={`button-${id}`}
            className="UI ui-button"
            style={{ backgroundColor: color }}
            onMouseDown={handleButtonClick}
            onTouchStart={handleButtonClick}
        >
            {text}
            <div style={{ position: 'relative', top: 0, right: 0, pointerEvents: 'none' }}> {icon} </div>
        </button>
    );
};

export default Button;