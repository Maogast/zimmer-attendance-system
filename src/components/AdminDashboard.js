// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Modal,
  TextField,
  Box,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import {
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  addNewClass,
  updateClass,
  deleteClass,
  addMemberToClass,
} from '../firebaseHelpers';

// ------ Helper: Compute summary statistics for a class ------
const calculateClassAttendanceSummary = (classData) => {
  const { members } = classData;
  const totalMembers = members?.length || 0;
  const totalLessons =
    members && members.length > 0 && members[0].attendance
      ? members[0].attendance.length
      : 0;
  let totalAttendances = 0;
  members?.forEach((member) => {
    totalAttendances += member.attendance?.filter((x) => x).length || 0;
  });
  const possibleAttendances = totalMembers * totalLessons;
  const attendanceRate =
    possibleAttendances > 0
      ? ((totalAttendances / possibleAttendances) * 100).toFixed(2)
      : 'N/A';
  return { totalMembers, totalLessons, attendanceRate };
};

// ------ Helper Functions for CSV Report Generation -------
const convertJSONToCSV = (jsonData) => {
  if (!jsonData || jsonData.length === 0) return '';
  const headers = Object.keys(jsonData[0]);
  const csvRows = [
    headers.join(','), // CSV header row.
    ...jsonData.map((row) =>
      headers.map((header) => `"${row[header] || ''}"`).join(',')
    ),
  ];
  return csvRows.join('\n');
};

const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // State
  const [classesData, setClassesData] = useState([]);
  const [filterClassType, setFilterClassType] = useState('All');
  const [loading, setLoading] = useState(true);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Modal states
  const [openAddClassModal, setOpenAddClassModal] = useState(false);
  const [openEditClassModal, setOpenEditClassModal] = useState(false);
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);

  // Add Class fields
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassElder, setNewClassElder] = useState('');
  const [classModalError, setClassModalError] = useState('');

  // Edit Class fields
  const [editClassId, setEditClassId] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editClassElder, setEditClassElder] = useState('');

  // Add Member fields
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newMemberFullName, setNewMemberFullName] = useState('');
  const [newMemberResidence, setNewMemberResidence] = useState('');
  const [newMemberPrayerCell, setNewMemberPrayerCell] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberMembership, setNewMemberMembership] = useState('Member');
  const [newMemberBaptized, setNewMemberBaptized] = useState('Not Baptized');
  const [memberModalError, setMemberModalError] = useState('');

  // Reporting
  const [reportMode, setReportMode] = useState('month');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Real-time fetch classes
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        setClassesData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching classes:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredClasses = classesData.filter(
    (cls) => filterClassType === 'All' || cls.classType === filterClassType
  );

  const showSnackbar = (msg) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  const openConfirmDialog = (title, message, onConfirm) =>
    setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirmDialog = () =>
    setConfirmDialog((c) => ({ ...c, open: false }));

  // Add Class
  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newClassTeacher.trim()) {
      setClassModalError('Please fill out required fields');
      return;
    }
    try {
      await addNewClass({
        name: newClassName.trim(),
        teacher: newClassTeacher.trim(),
        elder: newClassElder.trim(),
        classType: 'Church Service',
        members: [],
      });
      showSnackbar('Class added');
      setOpenAddClassModal(false);
      setNewClassName('');
      setNewClassTeacher('');
      setNewClassElder('');
      setClassModalError('');
    } catch {
      setClassModalError('Error adding class');
    }
  };

  // Edit Class
  const handleUpdateClass = async () => {
    if (!editClassName.trim() || !editClassTeacher.trim()) {
      alert('Please fill out required fields');
      return;
    }
    try {
      await updateClass(editClassId, {
        name: editClassName.trim(),
        teacher: editClassTeacher.trim(),
        elder: editClassElder.trim(),
      });
      showSnackbar('Class updated');
      setOpenEditClassModal(false);
    } catch {
      alert('Error updating class');
    }
  };

  // Delete Class
  const handleDeleteClass = (id, name) => {
    openConfirmDialog('Delete Class', `Delete "${name}"?`, async () => {
      await deleteClass(id);
      showSnackbar('Class deleted');
      closeConfirmDialog();
    });
  };

  // Add Member
  const handleAddMember = async () => {
    if (!newMemberFullName.trim() || !newMemberPhone.trim() || !newMemberEmail.trim()) {
      setMemberModalError('Please fill required fields');
      return;
    }
    try {
      await addMemberToClass(selectedClassId, {
        fullName: newMemberFullName.trim(),
        residence: newMemberResidence.trim(),
        prayerCell: newMemberPrayerCell.trim(),
        phone: newMemberPhone.trim(),
        email: newMemberEmail.trim(),
        membership: newMemberMembership,
        baptized: newMemberBaptized,
        attendance: [],
      });
      showSnackbar('Member added');
      setOpenAddMemberModal(false);
    } catch {
      setMemberModalError('Error adding member');
    }
  };

  // Fetch Attendance Records
  const fetchAttendanceRecords = async () => {
    try {
      let q;
      if (reportMode === 'month') {
        q = query(
          collectionGroup(db, 'attendanceRecords'),
          where('year', '==', reportYear),
          where('month', '==', reportMonth)
        );
      } else {
        q = query(
          collectionGroup(db, 'attendanceRecords'),
          where('year', '==', reportYear)
        );
      }
      const snap = await getDocs(q);
      setAttendanceRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  const handleDownloadCSV = () => {
    const csv = convertJSONToCSV(attendanceRecords);
    const fileName = reportMode === 'month'
      ? `attendance-${reportYear}-${reportMonth}.csv`
      : `attendance-${reportYear}.csv`;
    downloadCSV(csv, fileName);
  };

  if (loading) return <Typography>Loading classes...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Class Management */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenAddClassModal(true)}
        sx={{ mb: 2 }}
      >
        Add New Class
      </Button>

      <FormControl sx={{ minWidth: 120, mb: 2 }}>
        <InputLabel>Class Type</InputLabel>
        <Select
          value={filterClassType}
          label="Class Type"
          onChange={(e) => setFilterClassType(e.target.value)}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Church Service">Church Service</MenuItem>
        </Select>
      </FormControl>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Elder</TableCell>
              <TableCell>Total Members</TableCell>
              <TableCell>Total Lessons</TableCell>
              <TableCell>Attendance Rate (%)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClasses.map((cls) => {
              const { totalMembers, totalLessons, attendanceRate } = calculateClassAttendanceSummary(cls);
              return (
                <TableRow
                  key={cls.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/attendance/${cls.id}`)}
                >
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.teacher}</TableCell>
                  <TableCell>{cls.elder}</TableCell>
                  <TableCell>{totalMembers}</TableCell>
                  <TableCell>{totalLessons}</TableCell>
                  <TableCell>{attendanceRate}%</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={(e) => { e.stopPropagation(); setSelectedClassId(cls.id); setOpenAddMemberModal(true); }}
                      sx={{ mr: 1 }}
                    >
                      Add Member
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary" 
                      onClick={(e) => { e.stopPropagation(); handleOpenEditClassModal(cls); }}
                      startIcon={<EditIcon />}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button onClick={confirmDialog.onConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Modals and Reporting omitted... (unchanged) */}
    </Box>
  );
};

export default AdminDashboard;
