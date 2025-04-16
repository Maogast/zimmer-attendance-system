// src/components/AttendanceTracker.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  TextField,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Typography
} from '@mui/material';
import { format } from 'date-fns';
import { getSaturdaysOfMonth } from '../utils/dateHelpers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { submitAttendanceForClass, addMemberToClass } from '../firebaseHelpers';

const AttendanceTracker = () => {
  const { classId } = useParams();

  // Persistent class fields fetched from Firestore.
  const [classDetails, setClassDetails] = useState({
    name: '',
    teacher: '',
    elder: '',
    members: []
  });
  const [loadingClass, setLoadingClass] = useState(true);

  // Local header fields (editable).
  const [className, setClassName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [elder, setElder] = useState('');

  // Attendance session details.
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [saturdays, setSaturdays] = useState([]);

  // Local working members list used to mark attendance.
  const [members, setMembers] = useState([]);

  // New member form state.
  const [newMember, setNewMember] = useState({
    fullName: '',
    residence: '',
    prayerCell: '',
    phoneNumber: '',
    email: '',
    membershipStatus: '',
    baptized: false
  });

  // Fetch persistent class document on mount.
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          const persistentMembers = data.members || [];
          setClassDetails({
            name: data.name || '',
            teacher: data.teacher || '',
            elder: data.elder || '',
            members: persistentMembers
          });
          setClassName(data.name || '');
          setTeacher(data.teacher || '');
          setElder(data.elder || '');
          setMembers(persistentMembers);
        }
      } catch (error) {
        console.error("Error fetching class data", error);
      } finally {
        setLoadingClass(false);
      }
    };

    fetchClassData();
  }, [classId]);

  // Update saturdays when month/year changes.
  useEffect(() => {
    setSaturdays(getSaturdaysOfMonth(year, month));
  }, [month, year]);

  // Handle new member form changes.
  const handleNewMemberChange = (field, value) => {
    setNewMember({ ...newMember, [field]: value });
  };

  // When adding a new member, update the persistent class via Firebase and then update local state.
  const handleAddMember = async () => {
    if (newMember.fullName.trim() === '') return;
    const newEmail = newMember.email.trim().toLowerCase();
    const newPhone = newMember.phoneNumber.trim();

    // Check for duplicate members locally.
    const duplicate = members.find(member =>
      (newEmail && member.email.trim().toLowerCase() === newEmail) ||
      (newPhone && member.phoneNumber.trim() === newPhone)
    );
    if (duplicate) {
      alert("A member with the same Email or Phone number already exists.");
      return;
    }

    // Create member object with a fresh attendance array for this session.
    const memberToAdd = {
      ...newMember,
      attendance: new Array(saturdays.length).fill(false)
    };

    try {
      // Update the persistent class document.
      await addMemberToClass(classId, memberToAdd);
      // After update, re-fetch the class document to get the updated members.
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const data = classSnap.data();
        const persistentMembers = data.members || [];
        setClassDetails({
          name: data.name || '',
          teacher: data.teacher || '',
          elder: data.elder || '',
          members: persistentMembers
        });
        setMembers(persistentMembers);
      }
      // Clear new member form.
      setNewMember({
        fullName: '',
        residence: '',
        prayerCell: '',
        phoneNumber: '',
        email: '',
        membershipStatus: '',
        baptized: false
      });
    } catch (error) {
      console.error("Error adding new member", error);
    }
  };

  // Toggle attendance for a member on a given Saturday.
  const toggleAttendance = (memberIndex, satIndex) => {
    const updatedMembers = [...members];
    // Ensure the attendance array is long enough.
    if (updatedMembers[memberIndex].attendance.length < saturdays.length) {
      const diff = saturdays.length - updatedMembers[memberIndex].attendance.length;
      updatedMembers[memberIndex].attendance = [
        ...updatedMembers[memberIndex].attendance,
        ...new Array(diff).fill(false)
      ];
    }
    updatedMembers[memberIndex].attendance[satIndex] = !updatedMembers[memberIndex].attendance[satIndex];
    setMembers(updatedMembers);
  };

  // CSV Export Feature.
  const exportAttendanceToCSV = () => {
    const header = [
      'No.',
      'Full Name',
      'Residence',
      'Prayer Cell',
      'Phone',
      'Email',
      'Membership Status',
      'Baptized?',
      ...saturdays.map((sat) => format(sat, 'dd/MM'))
    ];
    const rows = members.map((member, index) => [
      index + 1,
      member.fullName,
      member.residence,
      member.prayerCell,
      member.phoneNumber,
      member.email,
      member.membershipStatus,
      member.baptized ? 'Yes' : 'No',
      ...member.attendance.map((present) => (present ? 'P' : 'A'))
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${className || 'Attendance'}-${month + 1}-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Attendance Feature: Save a snapshot of the attendance data to Firestore.
  const handleSubmitAttendance = async () => {
    const attendanceData = {
      recordId: `${year}-${month}`,
      className,
      teacher,
      elder,
      month,
      year,
      saturdays: saturdays.map((sat) => format(sat, 'yyyy-MM-dd')),
      members // snapshot of current working attendance data
    };

    try {
      await submitAttendanceForClass(classId, attendanceData);
      alert('Attendance submitted successfully!');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Error submitting attendance, please try again.');
    }
  };

  if (loadingClass) {
    return <Typography>Loading class data...</Typography>;
  }

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      {/* Header Form */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Class Name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Teacher(s)"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Elder Attached"
            value={elder}
            onChange={(e) => setElder(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            label="Month (0-11)"
            type="number"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        {className || 'Class Name'} Attendance for {month + 1}/{year}
      </Typography>

      {/* Attendance Data Table */}
      <TableContainer component={Paper} sx={{ mb: 2, minWidth: '1100px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Residence</TableCell>
              <TableCell>Prayer Cell</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Membership Status</TableCell>
              <TableCell>Baptized?</TableCell>
              {saturdays.map((sat, idx) => (
                <TableCell key={idx}>{format(sat, 'dd/MM')}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{member.fullName}</TableCell>
                <TableCell>{member.residence}</TableCell>
                <TableCell>{member.prayerCell}</TableCell>
                <TableCell>{member.phoneNumber}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.membershipStatus}</TableCell>
                <TableCell>{member.baptized ? 'Yes' : 'No'}</TableCell>
                {member.attendance.map((present, satIndex) => (
                  <TableCell key={satIndex}>
                    <Checkbox checked={present} onChange={() => toggleAttendance(index, satIndex)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {/* Row to add a new member */}
            <TableRow>
              <TableCell>
                <TextField
                  placeholder="Full Name"
                  value={newMember.fullName}
                  onChange={(e) => handleNewMemberChange('fullName', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Residence"
                  value={newMember.residence}
                  onChange={(e) => handleNewMemberChange('residence', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Prayer Cell"
                  value={newMember.prayerCell}
                  onChange={(e) => handleNewMemberChange('prayerCell', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Phone"
                  value={newMember.phoneNumber}
                  onChange={(e) => handleNewMemberChange('phoneNumber', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) => handleNewMemberChange('email', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <FormControl fullWidth>
                  <InputLabel>Membership Status</InputLabel>
                  <Select
                    value={newMember.membershipStatus}
                    label="Membership Status"
                    onChange={(e) => handleNewMemberChange('membershipStatus', e.target.value)}
                  >
                    <MenuItem value="Member">Member</MenuItem>
                    <MenuItem value="Non-Member">Non-Member</MenuItem>
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell>
                <FormControlLabel
                  control={<Checkbox checked={newMember.baptized} onChange={(e) => handleNewMemberChange('baptized', e.target.checked)} />}
                  label="Baptized"
                />
              </TableCell>
              <TableCell colSpan={saturdays.length}>
                <Button variant="contained" onClick={handleAddMember}>
                  Add Member
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Buttons */}
      <Grid container spacing={2}>
        <Grid item>
          <Button variant="outlined" color="secondary" onClick={exportAttendanceToCSV} sx={{ mr: 2 }}>
            Export to CSV
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleSubmitAttendance}>
            Submit Attendance
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default AttendanceTracker;