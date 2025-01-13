import React from 'react';
import '../App.css';
import Button from './Button';
import { Home, Star, Favorite } from '@mui/icons-material';


const UI = ({ createRectangle, zoom, mouseFollowerRef }) => {
    const buttons = [
        { id: 1, text: '1', color: '#4CAF50', icon: <Home /> },
        { id: 2, text: '2', color: '#2196F3', icon: <Star /> },
        { id: 3, text: '3', color: '#f44336', icon: <Favorite /> },
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
                            icon={button.icon}
                        />
                    ))
                }
            </div >
        </div >
    );
};

export default UI;