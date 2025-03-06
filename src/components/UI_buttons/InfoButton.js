import React, { useState, useCallback } from 'react';
import '../styles/Buttons.css';
import '../styles/InfoBox.css';

const InfoButton = React.forwardRef(({ setOverlay, infoBoxes }, ref) => {
    const [isSelected, setIsSelected] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    const handleTouchStart = useCallback(() => {
        setIsTouched(true);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsTouched(false);
        setOverlay(!isSelected);
        setIsSelected(!isSelected);
    }, [isSelected, setOverlay]);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        setOverlay(!isSelected);
        setIsSelected(!isSelected);
    }, [isSelected, setOverlay]);

    const handleClose = useCallback(() => {
        setIsSelected(false);
        setTimeout(() => { setOverlay(false); }, 200);
    }, [setOverlay]);

    // Hnadle link interactions
    const handleLinkActivation = useCallback((e, url) => {
        e.stopPropagation();

        // Create an actual anchor element and trigger it programmatically
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        // Real link click to the browser
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        e.preventDefault();
    }, []);

    return (
        <>
            <button
                className={`UI info-button ${isSelected ? 'selected' : ''} ${isTouched ? 'hover' : ''}`}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                ref={ref}
            >
                <div className='info-button-i'>i</div>
            </button>

            {infoBoxes.map((box, index) => {
                const placementClass = box.placement ? `info-text-box-${box.placement} ${box.subPlacement}` : '';

                return (
                    <div
                        key={index}
                        className={`UI info-text-box ${placementClass} ${isSelected ? 'visible' : ''} ${box.class !== undefined ? box.class : ''}`}
                        style={{
                            position: 'fixed',
                            top: box.top !== undefined ? `${box.top}` : undefined,
                            left: box.left !== undefined ? `${box.left}` : undefined,
                            right: box.right !== undefined ? `${box.right}` : undefined,
                            bottom: box.bottom !== undefined ? `${box.bottom}` : undefined
                        }}
                    >
                        <div className="info-text-box-content">
                            {box.text}
                            {box.link && (
                                <span
                                    className={`info-link ${isSelected ? 'visible' : ''}`}
                                    onClick={(e) => handleLinkActivation(e, box.link.url)}
                                    onTouchStart={(e) => handleLinkActivation(e, box.link.url)}
                                >
                                    {box.link.text}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}

            <div
                className={`UI info-overlay ${isSelected ? 'visible' : ''}`}
                onClick={handleClose}
                onTouchEnd={handleClose}
            />
        </>
    );
});

export default React.memo(InfoButton);