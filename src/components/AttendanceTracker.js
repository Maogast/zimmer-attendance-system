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
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { submitAttendanceForClass, addMemberToClass, logTeacherAction } from '../firebaseHelpers';
import { getSaturdaysOfMonth } from '../utils/dateHelpers';

const AttendanceTracker = () => {
  const { classId } = useParams();

  // ---------------------------
  // Authentication State (for teacher logging)
  // ---------------------------
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // ---------------------------
  // Class & Attendance State
  // ---------------------------
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [elder, setElder] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [saturdays, setSaturdays] = useState([]);
  const [members, setMembers] = useState([]);

  // ---------------------------
  // New Member Form State (Admin responsibility)
  // ---------------------------
  // For teacher view, the "Add Member" functionality should be hidden or removed.
  // We'll still include its code here in case you need to reuse it, but it won't be exposed in this teacher interface.
  const [newMember, setNewMember] = useState({
    fullName: '',
    residence: '',
    prayerCell: '',
    phoneNumber: '',
    email: '',
    membershipStatus: '',
    baptized: false,
  });

  // ---------------------------
  // Submission and Notification State
  // ---------------------------
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // "success" or "error"

  // ---------------------------
  // Fetch Class Data from Firestore
  // ---------------------------
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassName(data.name || '');
          setTeacher(data.teacher || '');
          setElder(data.elder || '');
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
        setSnackbarMessage('Error fetching class data');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  // ---------------------------
  // Compute Saturdays for Selected Month/Year
  // ---------------------------
  useEffect(() => {
    setSaturdays(getSaturdaysOfMonth(year, month));
  }, [month, year]);

  // ---------------------------
  // (Optional) New Member Form Handlers (Admin Only)
  // ---------------------------
  const handleNewMemberChange = (field, value) => {
    setNewMember((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMember = async () => {
    if (
      !newMember.fullName.trim() ||
      !newMember.email.trim() ||
      !newMember.phoneNumber.trim() ||
      !newMember.membershipStatus
    ) {
      setSnackbarMessage("Please fill out all required fields for the new member.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const newMemberData = {
      fullName: newMember.fullName.trim(),
      residence: newMember.residence.trim(),
      prayerCell: newMember.prayerCell.trim(),
      phoneNumber: newMember.phoneNumber.trim(),
      email: newMember.email.trim(),
      membershipStatus: newMember.membershipStatus,
      baptized: newMember.baptized,
      attendance: new Array(saturdays.length).fill(false),
    };

    try {
      await addMemberToClass(classId, newMemberData);
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const data = classSnap.data();
        setMembers(data.members || []);
        setSnackbarMessage("Member added successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
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
      setSnackbarMessage("Error adding member, please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // ---------------------------
  // Toggle Attendance for a Member on a Specific Saturday
  // ---------------------------
  const toggleAttendance = (memberIndex, satIndex) => {
    const updatedMembers = [...members];
    // Ensure the attendance array covers all saturdays.
    if (updatedMembers[memberIndex].attendance.length < saturdays.length) {
      const diff = saturdays.length - updatedMembers[memberIndex].attendance.length;
      updatedMembers[memberIndex].attendance = [
        ...updatedMembers[memberIndex].attendance,
        ...new Array(diff).fill(false),
      ];
    }
    updatedMembers[memberIndex].attendance[satIndex] = !updatedMembers[memberIndex].attendance[satIndex];
    setMembers(updatedMembers);
  };

  // ---------------------------
  // Export Attendance Data to CSV
  // ---------------------------
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
      ...saturdays.map((sat) => format(sat, 'dd/MM')),
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
      ...member.attendance.map((present) => (present ? 'P' : 'A')),
    ]);
    const csvContent = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
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

  // ---------------------------
  // Event Handler: Submit Attendance
  // ---------------------------
  const handleSubmitAttendance = async () => {
    setSubmittingAttendance(true);
    const attendanceData = {
      recordId: `${year}-${month}`, // e.g., "2025-4"
      className,
      teacher,
      elder,
      month,
      year,
      saturdays: saturdays.map((sat) => format(sat, 'yyyy-MM-dd')),
      members, // Attendance snapshot
      timestamp: serverTimestamp(),
    };

    try {
      await submitAttendanceForClass(classId, attendanceData);
      if (currentUser) {
        await logTeacherAction(
          currentUser.uid,
          currentUser.email,
          "SUBMIT_ATTENDANCE",
          { classId, recordId: attendanceData.recordId }
        );
      }
      setSnackbarMessage("Attendance submitted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setSnackbarMessage("Error submitting attendance, please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  if (loading) {
    return <Typography variant="h6">Loading class data...</Typography>;
  }

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      {/* Editable Header Fields (if required by teacher) */}
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
            {/* Remove the New Member Entry Row from the Teacher Interface */}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Export and Submit Actions */}
      <Grid container spacing={2}>
        <Grid item>
          <Button variant="outlined" color="secondary" onClick={exportAttendanceToCSV} sx={{ mr: 2 }}>
            Export to CSV
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleSubmitAttendance} disabled={submittingAttendance}>
            {submittingAttendance ? "Submitting..." : "Submit Attendance"}
          </Button>
        </Grid>
      </Grid>

      {/* Snackbar for Notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AttendanceTracker;
