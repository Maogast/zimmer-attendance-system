// src/components/TeacherView.js
import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AddMemberForm from './AddMemberForm';

const TeacherView = () => {
  // Assume your route includes the classId parameter.
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch the class data from Firestore.
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
    // Pull fresh data after adding a member.
    fetchClassData();
  };

  if (loading) {
    return <Typography variant="h6">Loading class data...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher View - {classData?.name}
      </Typography>
      
      {/* Displaying current members */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Members: {classData?.members ? classData.members.map(m => m.fullName).join(', ') : 'No members yet'}
      </Typography>
      
      {/* Form to add a new member */}
      <AddMemberForm classId={classData.id} onMemberAdded={handleMemberAdded} />
    </Box>
  );
};

export default TeacherView;