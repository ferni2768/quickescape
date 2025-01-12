import React from 'react';
import '../App.css';
import Button from './Button'; // Import the Button component

const UI = ({ createRectangle, zoom, mouseFollowerRef }) => {
    const buttons = [
        { id: 1, text: 'Button 1', color: '#4CAF50' },
        { id: 2, text: 'Button 2', color: '#2196F3' },
        { id: 3, text: 'Button 3', color: '#f44336' },
    ];

    return (
        <div>
            <div className="ui-container">
                {
                    buttons.map(button => (
                        <Button
                            key={button.id}
                            id={button.id}
                            text={button.text}
                            color={button.color}
                            createRectangle={createRectangle}
                            zoom={zoom}
                            mouseFollowerRef={mouseFollowerRef}
                        />
                    ))
                }
            </div >
        </div >
    );
};

export default UI;