// src/components/MarkSaturdayAttendance.js
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MarkSaturdayAttendance = ({ classData, onAttendanceMarked }) => {
  // Initialize attendance state with a boolean for each member.
  const [attendance, setAttendance] = useState(() =>
    classData.members.map(() => false)
  );
  const [attendanceDate, setAttendanceDate] = useState('');
  const [error, setError] = useState('');

  // Handle checkbox changes by updating the attendance state.
  const handleCheckboxChange = (index) => (e) => {
    const updatedAttendance = [...attendance];
    updatedAttendance[index] = e.target.checked;
    setAttendance(updatedAttendance);
  };

  // Handle submission of attendance.
  const handleSubmit = async () => {
    if (!attendanceDate) {
      setError('Please select a date.');
      return;
    }
    
    // Validate that the chosen date is a Saturday.
    const selectedDate = new Date(attendanceDate);
    if (selectedDate.getDay() !== 6) {
      setError('The selected date must be a Saturday.');
      return;
    }
    
    // Use the date (in the format YYYY-MM-DD) as the document ID.
    const attendanceDocId = attendanceDate;
    
    // Extract a list of member IDs (or a unique identifier)
    // from those checked. (Assumes that each member has an "id"
    // property; if not, you might use a unique field such as email.)
    const presentMemberIds = classData.members
      .filter((member, index) => attendance[index])
      .map((member) => member.id || member.email);
    
    // Reference the attendance record document in the subcollection.
    const attendanceDocRef = doc(
      db,
      'classes',
      classData.id,
      'attendanceRecords',
      attendanceDocId
    );
    
    try {
      // Create or merge the attendance record.
      await setDoc(
        attendanceDocRef,
        {
          date: selectedDate,
          presentMembers: presentMemberIds,
        },
        { merge: true }
      );
      onAttendanceMarked && onAttendanceMarked();
    } catch (err) {
      setError('Error marking attendance: ' + err.message);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Mark Saturday Attendance</Typography>
      <TextField
        label="Saturday Date"
        type="date"
        value={attendanceDate}
        onChange={(e) => {
          setAttendanceDate(e.target.value);
          setError(''); // Clear any previous error
        }}
        sx={{ mt: 2 }}
      />
      {classData.members.map((member, index) => (
        <Box key={index}>
          <FormControlLabel
            control={
              <Checkbox
                checked={attendance[index]}
                onChange={handleCheckboxChange(index)}
              />
            }
            label={member.fullName}
          />
        </Box>
      ))}
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        Submit Attendance
      </Button>
    </Box>
  );
};

export default MarkSaturdayAttendance;