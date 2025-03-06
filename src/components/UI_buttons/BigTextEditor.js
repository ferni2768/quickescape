import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import '../styles/TripName.css';

const BigTextEditor = memo(({ text, setText, setTwoLines }) => {
    const [isEditing, setIsEditing] = useState(false);
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
    }, [isEditing, text.length]);

    // Handle click outside to exit editing mode
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isEditing && !event.target.closest('.big-text-editor'))
                setIsEditing(false);
        };
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('touchstart', handleClickOutside, { passive: false });
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isEditing]);

    // Handle input change and limit to two lines
    const handleInputChange = useCallback((e) => {
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
    }, [setTwoLines, setText]);

    // Handle blur to remove the last line break
    const handleBlur = useCallback(() => {
        const textElement = textRef.current;
        const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight);
        textElement.textContent = text;
        const textHeight = textElement.scrollHeight;
        const numberOfLines = textHeight / lineHeight;

        let cleanText = text;

        // If there are more than 2 lines, trim the excess characters
        if (numberOfLines > 2.5) {
            while (textElement.scrollHeight / lineHeight > 2.5 && cleanText.length > 0) {
                cleanText = cleanText.slice(0, -1);
                textElement.textContent = cleanText;
            }
        }

        cleanText = cleanText.replace(/(\n\u200B?|\u200B)$/, '');

        if (cleanText !== text) setTwoLines(false);
        setText(cleanText);
        setIsEditing(false);
    }, [text, setTwoLines, setText]);

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
    }, [isEditing, text, setTwoLines, handleBlur]);

    // Handle backspace to remove the last line break
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Backspace' && text.endsWith('\u200B')) {
            e.preventDefault();
            const newText = text.slice(0, -2);
            const textarea = textareaRef.current;
            textarea.style.height = 'calc(1*(25px + 2vw))';
            setTwoLines(false);
            setText(newText);
        }
    }, [text, setTwoLines, setText]);

    // Memoize the click and touch handlers
    const handleClick = useCallback(() => setIsEditing(true), []);
    const handleTouchStart = useCallback(() => setIsEditing(true), []);

    // Check if the text exceeds 2 lines when loading it from memory
    useEffect(() => {
        const textElement = textRef.current;
        if (textElement) {
            const lineHeight = parseFloat(getComputedStyle(textElement).lineHeight);
            textElement.textContent = text;
            const textHeight = textElement.scrollHeight;
            const numberOfLines = textHeight / lineHeight;

            if (numberOfLines >= 1.5) setTwoLines(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <div className="UI big-text-editor" onClick={handleClick} onTouchStart={handleTouchStart}>
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
}, (prevProps, nextProps) => {
    return prevProps.setTwoLines === nextProps.setTwoLines && prevProps.text === nextProps.text && prevProps.setText === nextProps.setText;
});

export default BigTextEditor;