import React, { useState } from 'react';
import Button from './UI_buttons/Button';
import SwitchButton from './UI_buttons/SwitchButton';
import Trashcan from './UI_buttons/Trashcan';
import BigTextEditor from './UI_buttons/BigTextEditor';
import DateRangePicker from './UI_buttons/DateRangePicker';
import { Home, Star, Favorite, Lock, LockOpen, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import './styles/Buttons.css';

const UI = ({ createRectangle, zoom, mouseFollowerRef, locked, setLocked, deactivateRectangle, activeRectangle,
    startDate, endDate, setStartDate, setEndDate, isOpen, setIsOpen }) => {

    const [activeGroup, setActiveGroup] = useState(1);
    const [visible, setVisible] = useState(true); // State for visibility
    const [twoLines, setTwoLines] = useState(false);

    const buttonGroups = {
        1: [
            { id: 1, text: '1', color: '#4CAF50', size: 1, icon: <Home />, group: 1 },
            { id: 2, text: '2', color: '#2196F3', size: 2, icon: <Star />, group: 1 },
            { id: 3, text: '3', color: '#f44336', size: 1, icon: <Favorite />, group: 1 },
            { id: 4, text: '4', color: '#FF5722', size: 2, icon: <Favorite />, group: 1 },
        ],
        2: [
            { id: 5, text: '5', color: '#9C27B0', size: 1, icon: <Home />, group: 2 },
            { id: 6, text: '6', color: '#3F51B5', size: 2, icon: <Star />, group: 2 },
            { id: 7, text: '7', color: '#00BCD4', size: 1, icon: <Favorite />, group: 2 },
            { id: 8, text: '8', color: '#8BC34A', size: 2, icon: <Favorite />, group: 2 },
        ],
        3: [
            { id: 9, text: '9', color: '#FFC107', size: 1, icon: <Home />, group: 3 },
            { id: 10, text: '10', color: '#FFEB3B', size: 2, icon: <Star />, group: 3 },
            { id: 11, text: '11', color: '#FF9800', size: 1, icon: <Favorite />, group: 3 },
        ],
    };

    return (
        <div>
            <div style={{ display: visible ? 'flex' : 'none' }}>
                <div className="UI top-left-container">
                    <BigTextEditor className="UI" setTwoLines={setTwoLines} />
                    <DateRangePicker className="UI" startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} isOpen={isOpen} setIsOpen={setIsOpen} twoLines={twoLines} />
                </div>

                <div className="middle-left-container">
                    <div className="UI rectangle-button-container">
                        {Object.entries(buttonGroups).map(([groupId, buttons]) => (
                            <div key={groupId} className="rectangle-buttons-group">
                                {buttons.map(button => (
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
                                        activeGroup={activeGroup}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="UI note-button">
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

                    <div className="UI switch-buttons-container">
                        {[1, 2, 3].map(group => (
                            <SwitchButton
                                key={group}
                                group={group}
                                activeGroup={activeGroup}
                                setActiveGroup={setActiveGroup}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="UI bottom-left-container">
                <button className={`UI lock-button ${locked ? '' : 'unlocked'}`} onClick={() => setLocked(!locked)} onTouchStart={() => setLocked(!locked)}>
                    {locked ? <Lock /> : <LockOpen />}
                </button>

                <button className={`UI view-button ${visible ? '' : 'hidden'}`} onClick={() => setVisible(!visible)} onTouchStart={() => setVisible(!visible)}>
                    {visible ? <Visibility /> : <VisibilityOff />}
                </button>
            </div>

            <div className="UI bottom-right-container">
                <Trashcan className="UI trashcan" icon={<Delete />} deactivateRectangle={deactivateRectangle} activeRectangle={activeRectangle} />
            </div>
        </div>
    );
};

export default UI;