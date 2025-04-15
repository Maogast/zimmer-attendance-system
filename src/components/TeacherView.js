// src/components/TeacherView.js
import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AddMemberForm from './AddMemberForm';

const TeacherView = () => {
  const { classId } = useParams(); // assuming your route passes the classId
  const [classData, setClassData] = useState(null);

  const fetchClassData = async () => {
    try {
      // Assuming classes are stored in the 'classes' collection:
      const classesCollection = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesCollection);
      const classesList = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const currentClass = classesList.find((cls) => cls.id === classId);
      setClassData(currentClass);
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const handleMemberAdded = () => {
    // After a member is added, re-fetch the class data.
    fetchClassData();
  };

  if (!classData) {
    return <Typography>Loading class data...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher View - {classData.name}
      </Typography>
      {/* Display current members */}
      <Typography variant="h6">
        Members: {classData.members ? classData.members.map(m => m.fullName).join(', ') : 'No members yet'}
      </Typography>
      {/* Render the AddMemberForm */}
      <AddMemberForm classId={classData.id} onMemberAdded={handleMemberAdded} />
    </Box>
  );
};

export default TeacherView;