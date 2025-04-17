// src/components/MemberDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Paper, Button } from '@mui/material';

const MemberDetail = () => {
  const { classId, memberIndex } = useParams();
  const [member, setMember] = useState(null);
  const [className, setClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassName(data.name || 'Unnamed Class');
          if (data.members && data.members.length > parseInt(memberIndex, 10)) {
            setMember(data.members[parseInt(memberIndex, 10)]);
          }
        } else {
          console.error('Class not found for id:', classId);
        }
      } catch (error) {
        console.error('Error fetching member details:', error);
      }
    };

    fetchMember();
  }, [classId, memberIndex]);

  if (!member) {
    return <Typography>Loading member details...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="outlined" onClick={() => navigate(-1)}>
        Back
      </Button>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          {member.name}'s Details (Class: {className})
        </Typography>
        <Typography variant="body1"><strong>Email:</strong> {member.email}</Typography>
        <Typography variant="body1"><strong>Prayer Cell:</strong> {member.prayerCell}</Typography>
        <Typography variant="body1"><strong>Residence:</strong> {member.residence}</Typography>
        {/* Add any other member fields as needed */}
      </Paper>
    </Box>
  );
};

export default MemberDetail;