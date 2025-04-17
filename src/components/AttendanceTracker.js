// src/components/AttendanceTracker.js
import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, TextField, MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
// Removed "auth" from the following import as it was unused.
import { db } from '../firebase';
import { submitAttendanceForClass, logTeacherAction } from '../firebaseHelpers';
import { getSaturdaysOfMonth } from '../utils/dateHelpers';
import { useAuth } from '../contexts/AuthContext';

const AttendanceTracker = () => {
  const { classId } = useParams();
  const { currentUser } = useAuth();

  // Class attributes state.
  const [className, setClassName] = useState('');
  const [members, setMembers] = useState([]);

  // Attendance tracking state.
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed: 0 = January
  const [saturdays, setSaturdays] = useState([]);
  // "attendance" is a 2-D array: each row corresponds to a member and each column to a sabbath.
  const [attendance, setAttendance] = useState([]);

  // ---------------------------
  // Compute Saturdays for the selected month and year.
  // ---------------------------
  useEffect(() => {
    const sats = getSaturdaysOfMonth(year, month);
    setSaturdays(sats);
    // Reinitialize attendance array in case the month/year changes.
    setAttendance(members.map(() => new Array(sats.length).fill(false)));
  }, [year, month, members]);

  // ---------------------------
  // Fetch class data (including members) from Firestore.
  // ---------------------------
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassName(data.name || '');
          const fetchedMembers = data.members || [];
          setMembers(fetchedMembers);
          const sats = getSaturdaysOfMonth(year, month);
          setAttendance(fetchedMembers.map(() => new Array(sats.length).fill(false)));
        } else {
          console.error('No class data found for classId:', classId);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
    };

    fetchClassData();
  }, [classId, year, month]);

  // ---------------------------
  // Toggle attendance for a specific member on a specific sabbath.
  // ---------------------------
  const toggleAttendance = (memberIndex, satIndex) => {
    const updatedAttendance = [...attendance];
    updatedAttendance[memberIndex][satIndex] = !updatedAttendance[memberIndex][satIndex];
    setAttendance(updatedAttendance);
  };

  // ---------------------------
  // Event handler to submit attendance data.
  // ---------------------------
  const handleSubmitAttendance = async () => {
    const recordId = `${year}-${month}`; // e.g. "2025-0" for January if month=0
    const attendanceData = {
      recordId,
      className,
      year,
      month, // Selected month
      // Format each sabbath date (e.g., "2025-04-05").
      saturdays: saturdays.map((sat) => format(sat, 'yyyy-MM-dd')),
      // Attach each member's attendance array to the corresponding member.
      members: members.map((member, index) => ({
        ...member,
        attendance: attendance[index] || [],
      })),
      submittedAt: serverTimestamp(),
    };

    try {
      await submitAttendanceForClass(classId, attendanceData);
      if (currentUser) {
        await logTeacherAction(
          currentUser.uid,
          currentUser.email,
          "SUBMIT_ATTENDANCE",
          { classId, recordId }
        );
      }
      console.log("Attendance submitted and teacher action logged.");
      // Optionally, display a notification here.
    } catch (error) {
      console.error("Error submitting attendance:", error);
      // Optionally, display an error notification.
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Tracker for "{className}"
      </Typography>

      {/* Month and Year Selection Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Month"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          sx={{ width: '150px' }}
        >
          <MenuItem value={0}>January</MenuItem>
          <MenuItem value={1}>February</MenuItem>
          <MenuItem value={2}>March</MenuItem>
          <MenuItem value={3}>April</MenuItem>
          <MenuItem value={4}>May</MenuItem>
          <MenuItem value={5}>June</MenuItem>
          <MenuItem value={6}>July</MenuItem>
          <MenuItem value={7}>August</MenuItem>
          <MenuItem value={8}>September</MenuItem>
          <MenuItem value={9}>October</MenuItem>
          <MenuItem value={10}>November</MenuItem>
          <MenuItem value={11}>December</MenuItem>
        </TextField>
        <TextField
          label="Year"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          sx={{ width: '100px' }}
        />
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Mark attendance for each sabbath in {month + 1}/{year}
      </Typography>

      {/* Attendance Table */}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Member</th>
            {saturdays.map((sat, dateIndex) => (
              <th key={dateIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
                {format(sat, 'MMM dd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, memberIndex) => (
            <tr key={memberIndex}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {member.fullName || member.name}
              </td>
              {saturdays.map((_, dateIndex) => (
                <td
                  key={dateIndex}
                  style={{ border: '1px solid #ddd', textAlign: 'center', padding: '8px' }}
                >
                  <input
                    type="checkbox"
                    checked={attendance[memberIndex] ? attendance[memberIndex][dateIndex] : false}
                    onChange={() => toggleAttendance(memberIndex, dateIndex)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Submit Attendance Button */}
      <Button variant="contained" onClick={handleSubmitAttendance} sx={{ mt: 2 }}>
        Submit Attendance
      </Button>
    </Box>
  );
};

export default AttendanceTracker;