import React, { useState, useEffect } from 'react';
import { Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const TeacherView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // If no classId is provided, we assume teacher should see a list of classes.
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If a classId is provided in the URL, navigate directly to the AttendanceTracker.
    if (classId) {
      navigate(`/attendance-tracker/${classId}`);
    } else {
      // Otherwise, fetch the classes for the logged-in teacher.
      const fetchTeacherClasses = async () => {
        try {
          const classesRef = collection(db, 'classes');
          // Assumes your Firestore classes documents have a "teacher" field that matches the teacher's email.
          const q = query(classesRef, where('teacher', '==', currentUser.email));
          const querySnapshot = await getDocs(q);
          const classesList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTeacherClasses(classesList);
        } catch (error) {
          console.error("Error fetching teacher classes:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchTeacherClasses();
    }
  }, [classId, currentUser, navigate]);

  if (loading) {
    return <Typography variant="h6">Loading classes...</Typography>;
  }

  if (!classId && teacherClasses.length === 0) {
    return <Typography variant="h6">No classes assigned to you.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {!classId && (
        <>
          <Typography variant="h4" gutterBottom>
            Your Classes
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Click a class to mark attendance.
          </Typography>
          <List>
            {teacherClasses.map((cls) => (
              <ListItem 
                key={cls.id} 
                button 
                onClick={() => navigate(`/attendance-tracker/${cls.id}`)}
              >
                <ListItemText primary={cls.name} secondary={`Teacher: ${cls.teacher} | Elder: ${cls.elder}`} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default TeacherView;