// src/components/AddMemberForm.js
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { addMemberToClass } from '../firebaseHelpers';

const AddMemberForm = ({ classId, onMemberAdded }) => {
  // State for each form field.
  const [fullName, setFullName] = useState('');
  const [residence, setResidence] = useState('');
  const [prayerCell, setPrayerCell] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [membership, setMembership] = useState('Member'); // Options: Member or Visitor
  const [baptized, setBaptized] = useState('Not Baptized'); // Options: Baptized or Not Baptized
  const [error, setError] = useState('');

  // Called when the form is submitted.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation: ensure required fields are filled
    if (!fullName.trim() || !residence.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    
    // Construct a new member object with the additional data.
    const newMember = {
      fullName: fullName.trim(),
      residence: residence.trim(),
      prayerCell: prayerCell.trim(),
      phone: phone.trim(),
      email: email.trim(),
      membership,        // "Member" or "Visitor"
      baptized,          // "Baptized" or "Not Baptized"
      attendance: [],    // Initialize a blank attendance record (you may later manage this via subcollections)
    };

    try {
      // Use your helper function to add the member.
      await addMemberToClass(classId, newMember);
      
      // Clear the form fields after submission.
      setFullName('');
      setResidence('');
      setPrayerCell('');
      setPhone('');
      setEmail('');
      setMembership('Member');
      setBaptized('Not Baptized');
      setError('');
      
      // Optionally refresh the parent component's data.
      if (onMemberAdded) onMemberAdded();
    } catch (error) {
      console.error(error);
      setError('Error adding member, please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* Full Name */}
      <TextField
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      
      {/* Residence */}
      <TextField
        label="Residence"
        value={residence}
        onChange={(e) => setResidence(e.target.value)}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      
      {/* Prayer Cell */}
      <TextField
        label="Prayer Cell"
        value={prayerCell}
        onChange={(e) => setPrayerCell(e.target.value)}
        fullWidth
        sx={{ my: 1 }}
      />
      
      {/* Phone Number */}
      <TextField
        label="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      
      {/* Email Address */}
      <TextField
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        sx={{ my: 1 }}
      />
      
      {/* Membership: Member or Visitor */}
      <FormControl fullWidth sx={{ my: 1 }}>
        <InputLabel>Membership</InputLabel>
        <Select
          value={membership}
          label="Membership"
          onChange={(e) => setMembership(e.target.value)}
        >
          <MenuItem value="Member">Member</MenuItem>
          <MenuItem value="Visitor">Visitor</MenuItem>
        </Select>
      </FormControl>
      
      {/* Baptized: Baptized or Not Baptized */}
      <FormControl component="fieldset" sx={{ my: 1 }}>
        <FormLabel component="legend">Baptized</FormLabel>
        <RadioGroup
          row
          value={baptized}
          onChange={(e) => setBaptized(e.target.value)}
        >
          <FormControlLabel value="Baptized" control={<Radio />} label="Baptized" />
          <FormControlLabel value="Not Baptized" control={<Radio />} label="Not Baptized" />
        </RadioGroup>
      </FormControl>
      
      {/* Submit Button */}
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Add Member
      </Button>
    </Box>
  );
};

export default AddMemberForm;