import React, { useState, useMemo, useCallback } from 'react';
import Button from './UI_buttons/Button';
import SwitchButton from './UI_buttons/SwitchButton';
import Trashcan from './UI_buttons/Trashcan';
import InfoButton from './UI_buttons/InfoButton';
import BigTextEditor from './UI_buttons/BigTextEditor';
import DateRangePicker from './UI_buttons/DateRangePicker';
import NoteButton from './UI_buttons/NoteButton';
import { ICON_MAP } from '../Controller';
import './styles/Buttons.css';

const UI = React.memo(({ createRectangle, zoom, mouseFollowerRef, locked, setLocked, visible, setVisible, text, setText, startDate, endDate, setStartDate, setEndDate,
    isOpen, setIsOpen, setOverlay, activeRectangle, setOverTrashcanId, buttonContainerRef, clearData }) => {

    const [activeGroup, setActiveGroup] = useState(2);
    const [twoLines, setTwoLines] = useState(false);
    const [isLockTouched, setIsLockTouched] = useState(false);
    const [isViewTouched, setIsViewTouched] = useState(false);

    // Memoize SVG icons
    const lockIcon = useMemo(() => locked ? ICON_MAP['lock'] : ICON_MAP['lockOpen'], [locked]);
    const visibilityIcon = useMemo(() => visible ? ICON_MAP['visibility'] : ICON_MAP['visibilityOff'], [visible]);

    // Memoize InfoButton
    const MemoizedInfoButton = React.memo(InfoButton, (prevProps, nextProps) => {
        return (
            prevProps.setOverlay === nextProps.setOverlay &&
            prevProps.infoBoxes === nextProps.infoBoxes
        );
    });

    // Memoize event handlers
    const handleLockTouchStart = useCallback(() => {
        setIsLockTouched(true);
    }, []);

    const handleLockTouchEnd = useCallback(() => {
        setIsLockTouched(false);
        setLocked(!locked);
    }, [locked, setLocked]);

    const handleViewTouchStart = useCallback(() => {
        setIsViewTouched(true);
    }, []);

    const handleViewTouchEnd = useCallback(() => {
        setIsViewTouched(false);
        setVisible(!visible);
    }, [visible, setVisible]);

    // Memoize buttonGroups
    const buttonGroups = useMemo(() => ({
        1: [
            { id: 1, text: 'Plane', colorId: 'travel', size: 1, iconId: 'plane', group: 1 },
            { id: 2, text: 'Train', colorId: 'travel', size: 1, iconId: 'train', group: 1 },
            { id: 3, text: 'Bus', colorId: 'travel', size: 1, iconId: 'bus', group: 1 },
            { id: 4, text: 'Car', colorId: 'travel', size: 1, iconId: 'car', group: 1 },
        ],
        2: [
            { id: 5, text: 'Places', colorId: 'tour', size: 2, iconId: 'tour', group: 2 },
            { id: 6, text: 'Culture', colorId: 'culture', size: 2, iconId: 'culture', group: 2 },
            { id: 7, text: 'Shop', colorId: 'shop', size: 2, iconId: 'shop', group: 2 },
            { id: 8, text: 'Party', colorId: 'party', size: 2, iconId: 'party', group: 2 }
        ],
        3: [
            { id: 9, text: 'Hotel', colorId: 'hotel', size: 4, iconId: 'hotel', group: 3 },
            { id: 10, text: 'Eat', colorId: 'eat', size: 3, iconId: 'eat', group: 3 },
            { id: 11, text: 'Free', colorId: 'free', size: 4, iconId: 'free', group: 3 },
        ],
    }), []);

    const infoBoxes = useMemo(() => {

        const P = 'calc(2.3vh + 0.5rem)';

        const BLH = 'clamp(2.1rem, 2.5vw + 2.5vh, 2.5rem)';
        const BLW = `calc(${BLH} * 2 + calc(0.3vw + 0.5em))`;

        const BRD = 'clamp(2.9rem, 2.5vw + 2.5vh + 0.8rem, 3.5rem)';

        const IBD = 'clamp(1.4rem, 2.5vw + 2.5vh - 0.5rem, 1.6rem)';

        const MLB = 'calc(20vh + 1rem)';
        const SBD = 'clamp(1.4rem, 1.15vw + 1.65vh, 1.7rem)';
        const SBB = `calc(${MLB} + (${SBD} / 2) + 0.5ch)`;

        const RBL = 'calc(clamp(1.1rem, 1vw + 1.5vh, 1.35rem) * 5.5)';
        const RBH = 'clamp(1.1rem, 1vw + 1.5vh, 1.35rem)'
        const RBB = `calc(${SBB} + 1.5ch + 20px + 21px + ((${RBH} + 0.4em) * 3.8))`;

        const TLT = `calc(0.6rem + calc(0.3vw + 0.75em) + calc(25px + 2vw) + 0.3vw + 2.2em)`;

        return [
            {
                text: "Switch between event groups",
                placement: 'right',
                left: `calc(${SBD} * 4)`,
                bottom: SBB,
            },
            {
                text: "Lock the camera or hide buttons",
                placement: 'top',
                subPlacement: 'right',
                bottom: `calc(${P} + ${BLH})`,
                left: `calc(${P} + (${BLW} / 2))`,
            },
            {
                text: "Drag events here to delete",
                placement: 'left',
                bottom: `calc(${P} + (${BRD} / 2))`,
                right: `calc(${P} + ${BRD} + 1.25rem)`,
            },
            {
                class: `${twoLines ? 'two-lines' : ''}`,
                text: "Change the name and dates of the trip",
                placement: 'bottom',
                subPlacement: 'right',
                left: `${P}`,
                top: `${TLT}`,
            },
            {
                text: 'Zoom: Use Ctrl+/- or Pinch Gesture\n\nVersion: v0.1, by ferni2768',
                placement: 'bottom',
                subPlacement: 'left',
                top: `calc(${P} + ${IBD} + 1.25rem)`,
                right: `calc(${P} + (${IBD} / 2))`,
            },
            {
                text: "Drag events to the timeline",
                placement: 'right',
                left: `calc(${RBL})`,
                bottom: `calc(${RBB})`,
            }
        ];
    }, [twoLines]);


    return (
        <div>
            <div>
                <div className={`UI top-left-container ${visible ? 'in' : 'out'}`}>
                    <BigTextEditor className="UI" text={text} setText={setText} setTwoLines={setTwoLines} />
                    <DateRangePicker className="UI" startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} isOpen={isOpen} setIsOpen={setIsOpen} twoLines={twoLines} />
                </div>

                <div className={`middle-left-container ${visible ? 'in' : 'out'}`}>
                    <div className="UI rectangle-button-container" ref={buttonContainerRef}>
                        {Object.entries(buttonGroups).map(([groupId, buttons]) => (
                            <div key={groupId} className="rectangle-buttons-group">
                                {buttons.map(button => (
                                    <Button
                                        key={button.id}
                                        id={button.id}
                                        text={button.text}
                                        colorId={button.colorId}
                                        size={button.size}
                                        createRectangle={createRectangle}
                                        mouseFollowerRef={mouseFollowerRef}
                                        iconId={button.iconId}
                                        group={button.group}
                                        activeGroup={activeGroup}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="UI note-button">
                        <NoteButton
                            createRectangle={createRectangle}
                            mouseFollowerRef={mouseFollowerRef}
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

            <div className={`UI top-right-container ${isOpen ? 'hide' : ''}`}>
                <MemoizedInfoButton className="UI" setOverlay={setOverlay} infoBoxes={infoBoxes} />
            </div>

            <div className="UI bottom-left-container">
                <button
                    className={`UI lock-button ${locked ? '' : 'unlocked'} ${isLockTouched ? 'hover' : ''}`}
                    onClick={() => setLocked(!locked)}
                    onTouchStart={handleLockTouchStart}
                    onTouchEnd={handleLockTouchEnd}
                >
                    {lockIcon}
                </button>

                <button
                    className={`UI view-button ${visible ? '' : 'hidden'} ${isViewTouched ? 'hover' : ''}`}
                    onClick={() => setVisible(!visible)}
                    onTouchStart={handleViewTouchStart}
                    onTouchEnd={handleViewTouchEnd}
                >
                    {visibilityIcon}
                </button>
            </div>

            <div className="UI bottom-right-container" >
                <Trashcan className="UI trashcan" activeRectangle={activeRectangle} setOverTrashcanId={setOverTrashcanId} clearData={clearData} />
            </div>
        </div>
    );
});

const areEqual = (prevProps, nextProps) => {
    const isStartDateEqual = prevProps.startDate?.getTime() === nextProps.startDate?.getTime();
    const isEndDateEqual = prevProps.endDate?.getTime() === nextProps.endDate?.getTime();

    return (
        prevProps.createRectangle === nextProps.createRectangle &&
        prevProps.zoom === nextProps.zoom &&
        prevProps.mouseFollowerRef === nextProps.mouseFollowerRef &&
        prevProps.locked === nextProps.locked &&
        prevProps.setLocked === nextProps.setLocked &&
        prevProps.visible === nextProps.visible &&
        prevProps.setVisible === nextProps.setVisible &&
        isStartDateEqual &&
        isEndDateEqual &&
        prevProps.text === nextProps.text &&
        prevProps.setText === nextProps.setText &&
        prevProps.setStartDate === nextProps.setStartDate &&
        prevProps.setEndDate === nextProps.setEndDate &&
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.setIsOpen === nextProps.setIsOpen &&
        prevProps.setOverlay === nextProps.setOverlay &&
        prevProps.activeRectangle === nextProps.activeRectangle &&
        prevProps.setOverTrashcanId === nextProps.setOverTrashcanId
    );
};

export default React.memo(UI, areEqual);