// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import {
  Typography,
  Box,
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

// ------------------------------
// Helpers
// ------------------------------
const calculateClassAttendanceSummary = (classData) => {
  const members = classData.members || [];
  const totalMembers = members.length;
  const totalLessons = members[0]?.attendance?.length || 0;
  const totalAttendances = members.reduce(
    (sum, m) => sum + (m.attendance?.filter((x) => x).length || 0),
    0
  );
  const possible = totalMembers * totalLessons;
  return {
    totalMembers,
    totalLessons,
    attendanceRate:
      possible > 0 ? ((totalAttendances / possible) * 100).toFixed(2) : 'N/A',
  };
};

const convertJSONToCSV = (jsonData) => {
  if (!jsonData.length) return '';
  const headers = Object.keys(jsonData[0]);
  const rows = [
    headers.join(','),
    ...jsonData.map((row) =>
      headers.map((h) => `"${row[h] || ''}"`).join(',')
    ),
  ];
  return rows.join('\n');
};

const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
};

// ------------------------------
// Main Component
// ------------------------------
const AdminDashboard = () => {
  const navigate = useNavigate();

  // -- State: Classes & UI --
  const [classesData, setClassesData] = useState([]);
  const [filterClassType, setFilterClassType] = useState('All');
  const [loading, setLoading] = useState(true);

  // -- State: Snack & Confirm Dialog --
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // -- State: Add/Edit Class Modals --
  const [openAddClassModal, setOpenAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassElder, setNewClassElder] = useState('');
  const [classModalError, setClassModalError] = useState('');

  const [openEditClassModal, setOpenEditClassModal] = useState(false);
  const [editClassId, setEditClassId] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editClassElder, setEditClassElder] = useState('');

  // -- State: Add Member Modal --
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newMemberFullName, setNewMemberFullName] = useState('');
  const [newMemberResidence, setNewMemberResidence] = useState('');
  const [newMemberPrayerCell, setNewMemberPrayerCell] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberMembership, setNewMemberMembership] = useState('Member');
  const [newMemberBaptized, setNewMemberBaptized] = useState('Not Baptized');
  const [memberModalError, setMemberModalError] = useState('');

  // -- State: Reporting --
  const [reportMode, setReportMode] = useState('month');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // ------------------------------
  // Effects
  // ------------------------------
  useEffect(() => {
    // Real‑time classes
    const unsub = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        setClassesData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ------------------------------
  // UI Helpers
  // ------------------------------
  const showSnackbar = (msg) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  const openConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };
  const closeConfirmDialog = () =>
    setConfirmDialog((c) => ({ ...c, open: false }));

  // ------------------------------
  // Class CRUD
  // ------------------------------
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
      showSnackbar('Class created');
      setOpenAddClassModal(false);
      setNewClassName('');
      setNewClassTeacher('');
      setNewClassElder('');
      setClassModalError('');
    } catch {
      setClassModalError('Error creating class');
    }
  };

  const handleOpenEditClassModal = (cls) => {
    setEditClassId(cls.id);
    setEditClassName(cls.name);
    setEditClassTeacher(cls.teacher);
    setEditClassElder(cls.elder);
    setOpenEditClassModal(true);
  };

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

  const handleDeleteClass = (id, name) => {
    openConfirmDialog(`Delete "${name}"?`, 'This cannot be undone.', async () => {
      await deleteClass(id);
      showSnackbar('Class deleted');
      closeConfirmDialog();
    });
  };

  // ------------------------------
  // Member CRUD (Admin)
  // ------------------------------
  const handleOpenAddMemberModal = (classId) => {
    setSelectedClassId(classId);
    setOpenAddMemberModal(true);
  };

  const handleAddMember = async () => {
    if (!newMemberFullName.trim() || !newMemberPhone.trim() || !newMemberEmail.trim()) {
      setMemberModalError('Please fill out required fields');
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
      setMemberModalError('');
    } catch {
      setMemberModalError('Error adding member');
    }
  };

  // ------------------------------
  // Reporting
  // ------------------------------
  const fetchAttendanceRecords = async () => {
    const colGroup = collectionGroup(db, 'attendanceRecords');
    let qRef;
    if (reportMode === 'month') {
      qRef = query(
        colGroup,
        where('year', '==', reportYear),
        where('month', '==', reportMonth)
      );
    } else {
      qRef = query(colGroup, where('year', '==', reportYear));
    }
    try {
      const snap = await getDocs(qRef);
      setAttendanceRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCSV = () => {
    const csv = convertJSONToCSV(attendanceRecords);
    const fname =
      reportMode === 'month'
        ? `attendance-${reportYear}-${reportMonth}.csv`
        : `attendance-${reportYear}.csv`;
    downloadCSV(csv, fname);
  };

  if (loading) return <Typography>Loading classes…</Typography>;

  const filtered = classesData.filter(
    (c) => filterClassType === 'All' || c.classType === filterClassType
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* ────── Class Management ────── */}
      <Button
        variant="contained"
        onClick={() => setOpenAddClassModal(true)}
        sx={{ mb: 2 }}
      >
        Add New Class
      </Button>

      <FormControl sx={{ mb: 2, minWidth: 140 }}>
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

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Elder</TableCell>
              <TableCell># Members</TableCell>
              <TableCell># Lessons</TableCell>
              <TableCell>Attendance %</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((cls) => {
              const { totalMembers, totalLessons, attendanceRate } =
                calculateClassAttendanceSummary(cls);
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
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddMemberModal(cls.id);
                      }}
                    >
                      Add Member
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditClassModal(cls);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id, cls.name);
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/members/${cls.id}`);
                      }}
                    >
                      Manage Members
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ────── Confirm Delete ────── */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              confirmDialog.onConfirm();
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ────── Snackbars ────── */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      />

      {/* ────── Add Class Modal ────── */}
      <Modal open={openAddClassModal} onClose={() => setOpenAddClassModal(false)}>
        <Box sx={{ ...modalStyle, width: 360 }}>
          <Typography variant="h6">Add New Class</Typography>
          <TextField
            label="Class Name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Teacher"
            value={newClassTeacher}
            onChange={(e) => setNewClassTeacher(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Elder (opt.)"
            value={newClassElder}
            onChange={(e) => setNewClassElder(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          {classModalError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {classModalError}
            </Typography>
          )}
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleCreateClass}
          >
            Create
          </Button>
        </Box>
      </Modal>

      {/* ────── Edit Class Modal ────── */}
      <Modal open={openEditClassModal} onClose={() => setOpenEditClassModal(false)}>
        <Box sx={{ ...modalStyle, width: 360 }}>
          <Typography variant="h6">Edit Class</Typography>
          <TextField
            label="Class Name"
            value={editClassName}
            onChange={(e) => setEditClassName(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Teacher"
            value={editClassTeacher}
            onChange={(e) => setEditClassTeacher(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Elder (opt.)"
            value={editClassElder}
            onChange={(e) => setEditClassElder(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleUpdateClass}
          >
            Update
          </Button>
        </Box>
      </Modal>

      {/* ────── Add Member Modal ────── */}
      <Modal open={openAddMemberModal} onClose={() => setOpenAddMemberModal(false)}>
        <Box sx={{ ...modalStyle, width: 360 }}>
          <Typography variant="h6">Add Member</Typography>
          <TextField
            label="Full Name"
            value={newMemberFullName}
            onChange={(e) => setNewMemberFullName(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Residence"
            value={newMemberResidence}
            onChange={(e) => setNewMemberResidence(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Prayer Cell"
            value={newMemberPrayerCell}
            onChange={(e) => setNewMemberPrayerCell(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Phone"
            value={newMemberPhone}
            onChange={(e) => setNewMemberPhone(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Membership</InputLabel>
            <Select
              value={newMemberMembership}
              onChange={(e) => setNewMemberMembership(e.target.value)}
            >
              <MenuItem value="Member">Member</MenuItem>
              <MenuItem value="Visitor">Visitor</MenuItem>
            </Select>
          </FormControl>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              row
              value={newMemberBaptized}
              onChange={(e) => setNewMemberBaptized(e.target.value)}
            >
              <FormControlLabel value="Baptized" control={<Radio />} label="Baptized" />
              <FormControlLabel
                value="Not Baptized"
                control={<Radio />}
                label="Not Baptized"
              />
            </RadioGroup>
          </FormControl>
          {memberModalError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {memberModalError}
            </Typography>
          )}
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleAddMember}
          >
            Add Member
          </Button>
        </Box>
      </Modal>

      {/* ────── Attendance Reports ────── */}
      <Box sx={{ borderTop: '1px solid #ccc', pt: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Attendance Reports
        </Typography>
        <FormControl sx={{ mr: 2, width: 140 }}>
          <InputLabel>Mode</InputLabel>
          <Select
            value={reportMode}
            onChange={(e) => setReportMode(e.target.value)}
          >
            <MenuItem value="month">Monthly</MenuItem>
            <MenuItem value="year">Yearly</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Year"
          type="number"
          value={reportYear}
          onChange={(e) => setReportYear(+e.target.value)}
          sx={{ mr: 2, width: 100 }}
        />
        {reportMode === 'month' && (
          <TextField
            label="Month"
            type="number"
            value={reportMonth}
            onChange={(e) => setReportMonth(+e.target.value)}
            sx={{ mr: 2, width: 100 }}
            inputProps={{ min: 1, max: 12 }}
          />
        )}
        <Button variant="contained" onClick={fetchAttendanceRecords}>
          Fetch
        </Button>
        {attendanceRecords.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography>
              Found {attendanceRecords.length} record
              {attendanceRecords.length > 1 ? 's' : ''}.
            </Typography>
            <Button variant="outlined" sx={{ mt: 1 }} onClick={handleDownloadCSV}>
              Download CSV
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;

// shared modal styling
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};
