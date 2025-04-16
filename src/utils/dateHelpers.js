// src/utils/dateHelpers.js
export const getSaturdaysOfMonth = (year, month) => {
    const saturdays = [];
    let date = new Date(year, month, 1);
    // Move to the first Saturday
    while (date.getDay() !== 6) {
      date.setDate(date.getDate() + 1);
    }
    // Add each Saturday until the month changes
    while (date.getMonth() === month) {
      saturdays.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }
    return saturdays;
  };