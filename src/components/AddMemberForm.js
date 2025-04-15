// src/components/AddMemberForm.js
import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { addMemberToClass } from '../firebaseHelpers';

const AddMemberForm = ({ classId, onMemberAdded }) => {
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberName.trim()) {
      setError('Please enter a member name');
      return;
    }
    
    // Create the new member object.
    const newMember = {
      fullName: memberName.trim(),
      // Initialize attendance as an empty array; teachers can later mark attendance.
      attendance: [],
    };

    try {
      await addMemberToClass(classId, newMember);
      setMemberName('');
      setError('');
      // Call the onMemberAdded callback to refresh parent data if needed.
      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (error) {
      setError('Error adding member, please try again.');
      console.error(error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        label="Member Name"
        value={memberName}
        onChange={(e) => setMemberName(e.target.value)}
        variant="outlined"
        fullWidth
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit" variant="contained" sx={{ mt: 1 }}>
        Add Member
      </Button>
    </Box>
  );
};

export default AddMemberForm;