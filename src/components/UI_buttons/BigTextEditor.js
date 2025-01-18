import React, { useState, useRef, useEffect } from 'react';
import '../styles/TripName.css';

const BigTextEditor = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState("Trip");
    const textareaRef = useRef(null);

    // Focus on the textarea when editing
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.focus();
            // Move the cursor to the end of the text
            textarea.setSelectionRange(text.length, text.length);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    // Handle click outside to exit editing mode
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isEditing && !event.target.closest('.big-text-editor')) {
                setIsEditing(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('touchstart', handleClickOutside);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isEditing]);

    // Handle input change and limit to two lines
    const handleInputChange = (e) => {
        const textarea = textareaRef.current;
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * 2.1;

        if (textarea.scrollHeight <= maxHeight) {
            setText(e.target.value);
        }
    };


    return (
        <div className="UI big-text-editor" onClick={() => setIsEditing(true)} onTouchStart={() => setIsEditing(true)}>
            {isEditing ? (
                <textarea
                    className="UI big-text-area"
                    value={text}
                    onChange={handleInputChange}
                    ref={textareaRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onBlur={() => setIsEditing(false)}
                    spellCheck="false"
                />
            ) : (
                <div className="big-text-display">{text}</div>
            )}
        </div>
    );
};

export default BigTextEditor;