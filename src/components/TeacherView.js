// src/components/TeacherView.js
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const TeacherView = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // If no classId is provided, display a list of classes.
  const [teacherClasses, setTeacherClasses] = useState([]);
  // Use the loading state to show a loading message while fetching data.
  const [loading, setLoading] = useState(true);

  // States for confirmation dialog and feedback
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    // If a classId is provided, navigate directly to the AttendanceTracker.
    if (classId) {
      navigate(`/attendance-tracker/${classId}`);
    } else {
      // Otherwise, fetch the classes assigned to the logged-in teacher.
      const fetchTeacherClasses = async () => {
        try {
          const classesRef = collection(db, 'classes');
          // Assumes class documents have a "teacher" field that matches the teacher's email.
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
          // Stop showing the loading message once data is fetched.
          setLoading(false);
        }
      };

      fetchTeacherClasses();
    }
  }, [classId, currentUser, navigate]);

  // If loading, display a loading message.
  if (loading) {
    return <Typography variant="h6" sx={{ p: 3 }}>Loading classes...</Typography>;
  }

  if (!classId && teacherClasses.length === 0) {
    return <Typography variant="h6" sx={{ p: 3 }}>No classes assigned to you.</Typography>;
  }

  const handleClassClick = (cls) => {
    // Set the selected class and open the confirmation dialog.
    setSelectedClass(cls);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    // On confirmation, close dialog, show feedback and navigate.
    setConfirmOpen(false);
    setSnackbarMsg(`Redirecting to attendance tracker for ${selectedClass.name}...`);
    setSnackbarOpen(true);
    // Delay navigation slightly to allow the snackbar to appear.
    setTimeout(() => {
      navigate(`/attendance-tracker/${selectedClass.id}`);
    }, 1000);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setSelectedClass(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button */}
      <Button
        variant="contained"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/teacher-dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

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
                onClick={() => handleClassClick(cls)}
              >
                <ListItemText
                  primary={cls.name}
                  secondary={`Teacher: ${cls.teacher} | Elder: ${cls.elder}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancel}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">Confirm Attendance Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedClass
              ? `Do you want to mark attendance for ${selectedClass.name}?`
              : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">
            Yes, Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMsg}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      />
    </Box>
  );
};

export default TeacherView;