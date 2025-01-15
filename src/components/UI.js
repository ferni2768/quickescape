import React, { useState } from 'react';
import '../App.css';
import Button from './UI_buttons/Button';
import SwitchButton from './UI_buttons/SwitchButton';
import { Home, Star, Favorite, Lock, LockOpen } from '@mui/icons-material';


const UI = ({ createRectangle, zoom, mouseFollowerRef, locked, setLocked }) => {
    const [activeGroup, setActiveGroup] = useState(1);
    const startID = 1;

    const buttonGroups = {
        1: [
            { id: startID, text: '1', color: '#4CAF50', size: 1, icon: <Home />, group: 1 },
            { id: startID + 1, text: '2', color: '#2196F3', size: 2, icon: <Star />, group: 1 },
            { id: startID + 2, text: '3', color: '#f44336', size: 1, icon: <Favorite />, group: 1 },
            { id: startID + 3, text: '4', color: '#FF5722', size: 2, icon: <Favorite />, group: 1 },
        ],
        2: [
            { id: startID + 4, text: '5', color: '#9C27B0', size: 1, icon: <Home />, group: 2 },
            { id: startID + 5, text: '6', color: '#3F51B5', size: 2, icon: <Star />, group: 2 },
            { id: startID + 6, text: '7', color: '#00BCD4', size: 1, icon: <Favorite />, group: 2 },
            { id: startID + 7, text: '8', color: '#8BC34A', size: 2, icon: <Favorite />, group: 2 },
        ],
        3: [
            { id: startID + 8, text: '9', color: '#FFC107', size: 1, icon: <Home />, group: 3 },
            { id: startID + 9, text: '10', color: '#FFEB3B', size: 2, icon: <Star />, group: 3 },
            { id: startID + 10, text: '11', color: '#FF9800', size: 1, icon: <Favorite />, group: 3 },
        ],
    };

    return (
        <div>
            <div className="ui-container">
                {buttonGroups[activeGroup].map(button => (
                    <Button
                        key={button.id}
                        id={button.id}
                        text={button.text}
                        color={button.color}
                        size={button.size}
                        createRectangle={createRectangle}
                        zoom={zoom}
                        mouseFollowerRef={mouseFollowerRef}
                        icon={button.icon}
                        group={button.group}
                    />
                ))}

                <div className="note-button">
                    <Button
                        key={0}
                        id={0}
                        text={'Note'}
                        color={'#DAA520'}
                        size={1}
                        createRectangle={createRectangle}
                        zoom={zoom}
                        mouseFollowerRef={mouseFollowerRef}
                        icon={<Home />}
                        group={0}
                    />
                </div>

                <div className='UI switch-buttons-container'>
                    <div className="switch-buttons">
                        {[1, 2, 3].map(group => (
                            <SwitchButton
                                key={group}
                                group={group}
                                setActiveGroup={setActiveGroup}
                            />
                        ))}
                    </div>
                </div>

                <button className="UI lock-button" onClick={() => setLocked(!locked)}>
                    {locked ? <Lock /> : <LockOpen />}
                </button>
            </div>
        </div>
    );
};

export default UI;
