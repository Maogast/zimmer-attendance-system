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

  // Persistent class data fetched from Firestore.
  const [classDetails, setClassDetails] = useState({
    name: '',
    teacher: '',
    elder: '',
    members: []
  });
  const [loadingClass, setLoadingClass] = useState(true);

  // Editable header fields (you can update these if needed).
  const [className, setClassName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [elder, setElder] = useState('');

  // Attendance session settings.
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [saturdays, setSaturdays] = useState([]);

  // Local working attendance members list.
  const [members, setMembers] = useState([]);

  // New member entry state.
  const [newMember, setNewMember] = useState({
    fullName: '',
    residence: '',
    prayerCell: '',
    phoneNumber: '',
    email: '',
    membershipStatus: '',
    baptized: false,
  });

  useEffect(() => {
    // On mount fetch persistent class details from Firestore.
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassDetails({
            name: data.name || '',
            teacher: data.teacher || '',
            elder: data.elder || '',
            members: data.members || [],
          });
          setClassName(data.name || '');
          setTeacher(data.teacher || '');
          setElder(data.elder || '');
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setLoadingClass(false);
      }
    };

    fetchClassData();
  }, [classId]);

  // Update Saturdays when month or year changes.
  useEffect(() => {
    setSaturdays(getSaturdaysOfMonth(year, month));
  }, [month, year]);

  // Handle changes in the new member form.
  const handleNewMemberChange = (field, value) => {
    setNewMember({ ...newMember, [field]: value });
  };

  // Add a new member persistently via addMemberToClass and refresh local state.
  const handleAddMember = async () => {
    if (!newMember.fullName.trim() || !newMember.email.trim() || !newMember.phoneNumber.trim() || !newMember.membershipStatus) {
      alert("Please fill out all required fields.");
      return;
    }
    const newMemberData = {
      ...newMember,
      fullName: newMember.fullName.trim(),
      residence: newMember.residence.trim(),
      prayerCell: newMember.prayerCell.trim(),
      phoneNumber: newMember.phoneNumber.trim(),
      email: newMember.email.trim(),
      attendance: new Array(saturdays.length).fill(false),
    };

    try {
      await addMemberToClass(classId, newMemberData);
      // Re-fetch class data to update local attendance list.
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const data = classSnap.data();
        setClassDetails({
          name: data.name || '',
          teacher: data.teacher || '',
          elder: data.elder || '',
          members: data.members || [],
        });
        setMembers(data.members || []);
      }
      // Clear new member form.
      setNewMember({
        fullName: '',
        residence: '',
        prayerCell: '',
        phoneNumber: '',
        email: '',
        membershipStatus: '',
        baptized: false,
      });
    } catch (error) {
      console.error("Error adding new member:", error);
      alert("Error adding member, please try again.");
    }
  };

  // Toggle attendance (present/absent) for a member on a given Saturday.
  const toggleAttendance = (memberIndex, satIndex) => {
    const updatedMembers = [...members];
    // Ensure each member has an attendance array as long as the Saturdays.
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

  // Export the current attendance snapshot to CSV.
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
      ...saturdays.map(sat => format(sat, 'dd/MM'))
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
      ...member.attendance.map(present => (present ? 'P' : 'A'))
    ]);
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
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

  // Submit the attendance snapshot to Firestore.
  const handleSubmitAttendance = async () => {
    const attendanceData = {
      recordId: `${year}-${month}`,
      className,
      teacher,
      elder,
      month,
      year,
      saturdays: saturdays.map(sat => format(sat, 'yyyy-MM-dd')),
      members, // snapshot of the current working attendance for this session.
    };

    try {
      await submitAttendanceForClass(classId, attendanceData);
      alert("Attendance submitted successfully!");
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Error submitting attendance, please try again.");
    }
  };

  if (loadingClass) {
    return <Typography variant="h6">Loading class data...</Typography>;
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
                    <Checkbox
                      checked={present}
                      onChange={() => toggleAttendance(index, satIndex)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {/* Row for Adding a New Member */}
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
                    <MenuItem value="Visitor">Visitor</MenuItem>
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newMember.baptized}
                      onChange={(e) => handleNewMemberChange('baptized', e.target.checked)}
                    />
                  }
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

      {/* Action Buttons  */}
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