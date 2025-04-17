// src/components/MemberList.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Button 
} from '@mui/material';

const MemberList = () => {
  const { classId } = useParams();
  const [members, setMembers] = useState([]);
  const [className, setClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassMembers = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassName(data.name || 'Unnamed Class');
          setMembers(data.members || []);
        } else {
          console.error('Class not found for id:', classId);
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
      }
    };

    fetchClassMembers();
  }, [classId]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Members of {className}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Prayer Cell</strong></TableCell>
              <TableCell><strong>Residence</strong></TableCell>
              {/* Add additional headers if needed */}
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member, index) => (
              <TableRow key={index}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.prayerCell}</TableCell>
                <TableCell>{member.residence}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/admin/members/${classId}/${index}`)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No members found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MemberList;