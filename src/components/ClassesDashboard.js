// src/components/ClassesDashboard.js
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const ClassesDashboard = () => {
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for real-time updates on the classes collection.
    const classesRef = collection(db, 'classes');
    const unsubscribe = onSnapshot(
      classesRef,
      (snapshot) => {
        const classesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassesData(classesList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching classes:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount.
  }, []);

  if (loading) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        Loading Classes...
      </Typography>
    );
  }

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      {classesData.map((cls) => (
        <Grid item xs={12} sm={6} md={4} key={cls.id}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                {cls.name}
              </Typography>
              <Typography variant="subtitle1">
                Teacher: {cls.teacher}
              </Typography>
              <Typography variant="subtitle1">
                Elder: {cls.elder}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to={`/attendance/${cls.id}`}
                sx={{ mt: 2 }}
              >
                View Attendance
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {/* Extra Card: Navigate to Add New Class */}
      <Grid item xs={12} sm={6} md={4}>
        <Card sx={{ border: '2px dashed grey', textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Add New Class
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to="/admin"
              sx={{ mt: 2 }}
            >
              Create Class
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ClassesDashboard;