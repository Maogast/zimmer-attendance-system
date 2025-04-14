// src/utils/dateHelpers.js
export function getSaturdaysOfMonth(year, month) {
    // 'month' is 0-indexed: January = 0, February = 1, etc.
    const saturdays = [];
    let date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 6) { // Saturday
        saturdays.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return saturdays;
  }