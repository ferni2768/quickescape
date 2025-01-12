import React from 'react';
import '../App.css';

const Button = ({ createRectangle, zoom, mouseFollowerRef }) => {
    const handleButtonClick = () => {
        // Calculate the position relative to the room
        const { offsetLeft, offsetTop } = mouseFollowerRef.current;
        createRectangle((offsetLeft - 75 * zoom) / zoom, (offsetTop - 25 * zoom) / zoom, 50);
    };

    return (
        <div className="button-container">
            <button
                className="UI button"
                onMouseDown={handleButtonClick}>Create</button>
        </div>
    );
};

export default Button;