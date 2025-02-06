import React, { useMemo } from 'react';
import dayjs from 'dayjs';

const DateLabels = React.memo(({ startDate, endDate, gridSize }) => {
    // Memoize the dates array
    const dates = useMemo(() => {
        const datesArray = [];
        let currentDate = dayjs(startDate);

        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
            datesArray.push(currentDate);
            currentDate = currentDate.add(1, 'day');
        }

        return datesArray;
    }, [startDate, endDate]);


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
});

export default DateLabels;