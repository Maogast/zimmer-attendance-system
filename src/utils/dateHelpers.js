// src/utils/dateHelpers.js

// Returns an array of Date objects for every Saturday of the given month and year.
export const getSaturdaysOfMonth = (year, month) => {
    const saturdays = [];
    // Start at the first day of the month.
    let date = new Date(year, month, 1);
    // Find the first Saturday.
    while (date.getDay() !== 6) {
      date.setDate(date.getDate() + 1);
    }
    // Add each Saturday until the month changes.
    while (date.getMonth() === month) {
      saturdays.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }
    return saturdays;
  };