// src/components/Clock.js
import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update the time every second.
    const timerID = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerID); // Cleanup interval on unmount
  }, []);

  // Format date and time using toLocaleDateString and toLocaleTimeString
  const formattedDate = currentTime.toLocaleDateString();
  const formattedTime = currentTime.toLocaleTimeString();

  return (
    <div style={{ color: 'white', marginRight: '16px', whiteSpace: 'nowrap' }}>
      {formattedDate} {formattedTime}
    </div>
  );
};

export default Clock;