import React, { useState, useRef, useEffect } from 'react';
import '../styles/TripName.css';

const BigTextEditor = ({ setTwoLines }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState("Trip Name");
    const textareaRef = useRef(null);
    const textRef = useRef(null);

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
            if (isEditing && !event.target.closest('.big-text-editor'))
                setIsEditing(false);
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
        const textElement = textRef.current;
        let newText = e.target.value;

        // Check if the last character is '\n'
        if (newText.endsWith('\n')) newText += '\u200B';
        else if (!newText.endsWith('\u200B')) newText = newText.replace('\u200B', '');

        const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight);

        // Temporarily set the text to calculate the height
        textElement.textContent = newText;
        const textHeight = textElement.scrollHeight;
        const numberOfLines = textHeight / lineHeight;

        // Do not update the text if it exceeds 2 lines
        if (numberOfLines > 2.5) return;
        setText(newText);

        setTimeout(() => {
            if (numberOfLines < 1.5) {
                textarea.style.height = 'calc(1*(25px + 2vw))';
                setTwoLines(false);
            } else if (numberOfLines >= 1.5) {
                textarea.style.height = 'calc(2*(25px + 2vw))';
                setTwoLines(true);
            }
        }, 10);
    };

    // Handle blur to remove the last line break
    const handleBlur = () => {
        let cleanText = text.replace(/(\n\u200B?|\u200B)$/, '');
        if (cleanText !== text) setTwoLines(false);
        setText(cleanText);
        setIsEditing(false);
    };

    // Set the height of the textarea to fit the text when editing starts
    useEffect(() => {
        if (isEditing) {
            const textarea = textareaRef.current;
            const textElement = textRef.current;
            const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight);

            textElement.textContent = text;
            const textHeight = textElement.scrollHeight;
            const numberOfLines = textHeight / lineHeight;

            if (numberOfLines < 1.5) {
                textarea.style.height = 'calc(1*(25px + 2vw))';
                setTwoLines(false);
            } else if (numberOfLines >= 1.5) {
                textarea.style.height = 'calc(2*(25px + 2vw))';
                setTwoLines(true);
            }
        } else {
            handleBlur();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, text, setTwoLines]);

    // Handle backspace to remove the last line break
    const handleKeyDown = (e) => {
        if (e.key === 'Backspace' && text.endsWith('\u200B')) {
            e.preventDefault();
            const newText = text.slice(0, -2);
            const textarea = textareaRef.current;
            textarea.style.height = 'calc(1*(25px + 2vw))';
            setTwoLines(false);
            setText(newText);
        }
    };


    return (
        <div className="UI big-text-editor" onClick={() => setIsEditing(true)} onTouchStart={() => setIsEditing(true)}>
            {isEditing ? (
                <textarea
                    className="UI big-text-area"
                    value={text}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    ref={textareaRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    spellCheck="false"
                />
            ) : null}
            <div ref={textRef} className="big-text-display" style={{ opacity: isEditing ? 0 : 1 }}>
                {text}
            </div>
        </div>
    );
};

export default BigTextEditor;