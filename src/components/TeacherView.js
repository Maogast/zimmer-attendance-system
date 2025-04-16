// src/components/TeacherView.js
import React, { useState, useEffect } from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TeacherView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the class data from Firestore with proper error handling.
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          setClassData({ id: classSnap.id, ...classSnap.data() });
        } else {
          console.error("No class found with the provided ID.");
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  if (loading) {
    return <Typography variant="h6">Loading class data...</Typography>;
  }

  if (!classData) {
    return <Typography variant="h6">Class data not found.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher View - {classData.name}
      </Typography>
      {/* Instead of toggling a no-longer-supported component, simply navigate to AttendanceTracker */}
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => navigate(`/attendance-tracker/${classId}`)}
      >
        Mark Attendance Register
      </Button>
    </Box>
  );
};

export default TeacherView;