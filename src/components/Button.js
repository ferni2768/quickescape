import React from 'react';
import '../App.css';

const Button = ({ id, text, color, createRectangle, zoom, mouseFollowerRef }) => {
    const handleButtonClick = () => {
        // Calculate the position relative to the room
        const { offsetLeft, offsetTop } = mouseFollowerRef.current;
        createRectangle((offsetLeft - 75 * zoom) / zoom, (offsetTop - 25 * zoom) / zoom, 50, color);
    };

    return (
        <button
            id={`button-${id}`}
            className="UI ui-button"
            style={{ backgroundColor: color }}
            onMouseDown={handleButtonClick}
        >
            {text}
        </button>
    );
};

export default Button;