// src/components/ClassesDashboard.js
import React from 'react';
import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { Link } from 'react-router-dom';

// Updated classes list with your new classes
const classes = [
  { id: 'bethlehem', name: 'Bethlehem Class', teacher: 'Teacher Bethlehem', elder: 'Elder Bethlehem' },
  { id: 'judea', name: 'Judea', teacher: 'Teacher Judea', elder: 'Elder Judea' },
  { id: 'galilee', name: 'Galilee', teacher: 'Teacher Galilee', elder: 'Elder Galilee' },
  { id: 'samaria', name: 'Samaria', teacher: 'Teacher Samaria', elder: 'Elder Samaria' },
  { id: 'nazareth', name: 'Nazareth', teacher: 'Teacher Nazareth', elder: 'Elder Nazareth' },
  { id: 'baptismal', name: 'Baptismal', teacher: 'Teacher Baptismal', elder: 'Elder Baptismal' },
  { id: 'jerusalem', name: 'Jerusalem', teacher: 'Teacher Jerusalem', elder: 'Elder Jerusalem' },
];

const ClassesDashboard = () => {
  return (
    <Grid container spacing={3} style={{ padding: '20px' }}>
      {classes.map((cls) => (
        <Grid item xs={12} sm={6} md={4} key={cls.id}>
          <Card>
            <CardContent>
              <Typography variant="h5">{cls.name}</Typography>
              <Typography variant="subtitle1">Teacher: {cls.teacher}</Typography>
              <Typography variant="subtitle1">Elder: {cls.elder}</Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to={`/attendance/${cls.id}`}
                style={{ marginTop: '10px' }}
              >
                View Attendance
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ClassesDashboard;