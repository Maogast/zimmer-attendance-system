// src/components/TeacherView.js
import React, { useState, useEffect } from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MarkSaturdayAttendance from './MarkSaturdayAttendance';

const TeacherView = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);

  // Fetch the class data from Firestore
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          setClassData({ id: classSnap.id, ...classSnap.data() });
        } else {
          console.error('No class found with the provided ID.');
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  if (loading) {
    return <Typography variant="h6">Loading class data...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher View - {classData.name}
      </Typography>

      {/* Additional teacher-specific member management can go here */}

      {/* Always allow teachers to mark attendance for their class */}
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => setShowAttendanceForm(!showAttendanceForm)}
      >
        {showAttendanceForm ? 'Hide Attendance Form' : 'Mark Sabbath Attendance'}
      </Button>

      {showAttendanceForm && (
        <MarkSaturdayAttendance
          classData={classData}
          onAttendanceMarked={() => {
            // Optionally hide form or refresh class data once attendance is marked.
            setShowAttendanceForm(false);
          }}
        />
      )}
    </Box>
  );
};

export default TeacherView;