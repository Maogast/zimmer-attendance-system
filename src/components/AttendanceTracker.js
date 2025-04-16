// src/components/AttendanceTracker.js
import React, { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
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
  const [month, setMonth] = useState(new Date().getMonth());
  const [saturdays, setSaturdays] = useState([]);
  // "attendance" is a 2-D array: each row corresponds to a member and each column to a sabbath.
  const [attendance, setAttendance] = useState([]);

  // ---------------------------
  // Compute Saturdays for the selected month and year.
  // ---------------------------
  useEffect(() => {
    const sats = getSaturdaysOfMonth(year, month);
    setSaturdays(sats);
  }, [year, month]);

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
          // Initialize the attendance array for each member (all set to false).
          const initialAttendance = fetchedMembers.map(() =>
            new Array(getSaturdaysOfMonth(year, month).length).fill(false)
          );
          setAttendance(initialAttendance);
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
    const recordId = `${year}-${month}`; // e.g. "2025-4"
    const attendanceData = {
      recordId,
      className,
      year,
      month,
      // Format each sabbath date (e.g., "2025-04-05").
      saturdays: saturdays.map((sat) => format(sat, 'yyyy-MM-dd')),
      // For each member, attach their attendance array.
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
      // Optionally, you can display a notification to the user here.
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
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{member.fullName}</td>
              {saturdays.map((_, dateIndex) => (
                <td key={dateIndex} style={{ border: '1px solid #ddd', textAlign: 'center', padding: '8px' }}>
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
