import React from 'react';
import '../App.css';
import Button from './Button';
import { Home, Star, Favorite } from '@mui/icons-material';


const UI = ({ createRectangle, zoom, mouseFollowerRef }) => {
    const startID = 1;

    const buttons = [
        { id: startID, text: '1', color: '#4CAF50', icon: <Home />, group: 1 },
        { id: startID + 1, text: '2', color: '#2196F3', icon: <Star />, group: 1 },
        { id: startID + 2, text: '3', color: '#f44336', icon: <Favorite />, group: 1 },
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
                            group={button.group}
                        />
                    ))
                }

                <div className="note-button">
                    <Button
                        key={0}
                        id={0}
                        text={'Note'}
                        color={'#DAA520'}
                        createRectangle={createRectangle}
                        zoom={zoom}
                        mouseFollowerRef={mouseFollowerRef}
                        icon={<Home />}
                        group={0}
                    />

                </div>


            </div >
        </div >
    );
};

export default UI;