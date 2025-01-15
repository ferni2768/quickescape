import React from 'react';
import dayjs from 'dayjs';

const DateLabels = ({ startDate, endDate, gridSize }) => {
    const dates = [];
    let currentDate = dayjs(startDate);

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        dates.push(currentDate);
        currentDate = currentDate.add(1, 'day');
    }

    return (
        <div className="date-labels">
            {dates.map((date, index) => (
                <div
                    key={index}
                    className="date-label"
                    style={{ top: `${index * gridSize * 4 * 24}px` }}
                >
                    {date.format('D MMM')}
                </div>
            ))}
        </div>
    );
};

export default DateLabels;