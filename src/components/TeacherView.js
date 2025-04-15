// src/components/TeacherView.js
import React, { useState, useEffect } from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AddMemberForm from './AddMemberForm';
import MarkSaturdayAttendance from './TempAttendace';

const TeacherView = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);

  const fetchClassData = async () => {
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDocSnap = await getDoc(classDocRef);
      if (classDocSnap.exists()) {
        setClassData({ id: classDocSnap.id, ...classDocSnap.data() });
      } else {
        console.error('No class found with the provided ID.');
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const handleMemberAdded = () => {
    // Refresh class data to reflect any new members.
    fetchClassData();
  };

  const toggleAttendanceForm = () => {
    setShowAttendanceForm(!showAttendanceForm);
  };

  if (loading) {
    return <Typography variant="h6">Loading class data...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher View - {classData?.name}
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        Members: {classData?.members ? classData.members.map(m => m.fullName).join(', ') : 'No members yet'}
      </Typography>
      
      {/* Form to add a new member */}
      <AddMemberForm classId={classData.id} onMemberAdded={handleMemberAdded} />

      {/* Toggle button for attendance marking */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={toggleAttendanceForm}>
        {showAttendanceForm ? 'Hide Attendance Form' : 'Mark Saturday Attendance'}
      </Button>

      {showAttendanceForm && (
        <MarkSaturdayAttendance
          classData={classData}
          onAttendanceMarked={fetchClassData}
        />
      )}
    </Box>
  );
};

export default TeacherView;