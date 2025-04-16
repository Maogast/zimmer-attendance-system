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
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase';
import {
  addNewClass,
  updateClass,
  deleteClass,
  addMemberToClass,
} from '../firebaseHelpers';

// Helper to compute summary statistics for a class.
const calculateClassAttendanceSummary = (classData) => {
  const { members } = classData;
  const totalMembers = members?.length || 0;
  // Assume that if any member has attendance, all have the same number of lessons.
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
      : "N/A";
  return { totalMembers, totalLessons, attendanceRate };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filterClassType, setFilterClassType] = useState('All');
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Snackbar for quick user feedback.
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Confirmation dialog state (used when deleting classes).
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // ***** STATE FOR "Add New Class" MODAL *****
  const [openAddClassModal, setOpenAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassElder, setNewClassElder] = useState('');
  const [classModalError, setClassModalError] = useState('');

  // ***** STATE FOR "Edit Class" MODAL *****
  const [openEditClassModal, setOpenEditClassModal] = useState(false);
  const [editClassId, setEditClassId] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editClassElder, setEditClassElder] = useState('');

  // ***** STATE FOR "Add New Member" MODAL *****
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newMemberFullName, setNewMemberFullName] = useState('');
  const [newMemberResidence, setNewMemberResidence] = useState('');
  const [newMemberPrayerCell, setNewMemberPrayerCell] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberMembership, setNewMemberMembership] = useState('Member'); // "Member" or "Visitor"
  const [newMemberBaptized, setNewMemberBaptized] = useState('Not Baptized'); // "Baptized" or "Not Baptized"
  const [memberModalError, setMemberModalError] = useState('');

  // ---------------------------
  // REAL-TIME DATA FETCHING
  // ---------------------------
  useEffect(() => {
    const classesRef = collection(db, 'classes');
    const unsubscribe = onSnapshot(
      classesRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassesData(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching classes: ", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter classes if needed.
  const filteredClasses = classesData.filter((cls) => {
    if (filterClassType === "All") return true;
    return cls.classType === filterClassType;
  });

  // ---------------------------
  // HELPER FUNCTIONS
  // ---------------------------
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Confirmation Dialog functions.
  const openConfirmDialogFunc = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    handleCloseConfirmDialog();
  };

  // ---------------------------
  // CLASS MANAGEMENT FUNCTIONS
  // ---------------------------
  const handleOpenAddClassModal = () => {
    setOpenAddClassModal(true);
  };

  const handleCloseAddClassModal = () => {
    setOpenAddClassModal(false);
    setNewClassName('');
    setNewClassTeacher('');
    setNewClassElder('');
    setClassModalError('');
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newClassTeacher.trim()) {
      setClassModalError('Please enter both class name and teacher.');
      return;
    }
    const newClass = {
      name: newClassName.trim(),
      teacher: newClassTeacher.trim(),
      elder: newClassElder.trim() || '',
      classType: 'Church Service',
      members: [],
    };
    try {
      await addNewClass(newClass);
      showSnackbar('Class added successfully!');
      handleCloseAddClassModal();
    } catch (error) {
      console.error("Error creating class:", error);
      setClassModalError('Error creating class, please try again.');
    }
  };

  const handleOpenEditClassModal = (cls) => {
    setEditClassId(cls.id);
    setEditClassName(cls.name);
    setEditClassTeacher(cls.teacher);
    setEditClassElder(cls.elder);
    setOpenEditClassModal(true);
  };

  const handleCloseEditClassModal = () => {
    setOpenEditClassModal(false);
    setEditClassId('');
    setEditClassName('');
    setEditClassTeacher('');
    setEditClassElder('');
  };

  const handleUpdateClass = async () => {
    if (!editClassName.trim() || !editClassTeacher.trim()) {
      alert('Please enter both class name and teacher.');
      return;
    }
    try {
      await updateClass(editClassId, {
        name: editClassName.trim(),
        teacher: editClassTeacher.trim(),
        elder: editClassElder.trim() || '',
      });
      showSnackbar('Class updated successfully!');
      handleCloseEditClassModal();
    } catch (error) {
      console.error("Error updating class:", error);
      alert('Error updating class.');
    }
  };

  const handleDeleteClass = (classId, className) => {
    openConfirmDialogFunc(
      'Delete Class',
      `Are you sure you want to delete "${className}"?`,
      async () => {
        try {
          await deleteClass(classId);
          showSnackbar('Class deleted successfully!');
        } catch (error) {
          console.error("Error deleting class:", error);
          alert('Error deleting class.');
        }
      }
    );
  };

  // ---------------------------
  // MEMBER MANAGEMENT FUNCTIONS (Admin Only)
  // ---------------------------
  const handleOpenAddMemberModal = (classId) => {
    setSelectedClassId(classId);
    setOpenAddMemberModal(true);
  };

  const handleCloseAddMemberModal = () => {
    setOpenAddMemberModal(false);
    setNewMemberFullName('');
    setNewMemberResidence('');
    setNewMemberPrayerCell('');
    setNewMemberPhone('');
    setNewMemberEmail('');
    setNewMemberMembership('Member');
    setNewMemberBaptized('Not Baptized');
    setMemberModalError('');
  };

  const handleAddMember = async () => {
    if (!newMemberFullName.trim() || !newMemberResidence.trim() || !newMemberPhone.trim() || !newMemberEmail.trim()) {
      setMemberModalError('Please fill out all required fields.');
      return;
    }
    const newMemberData = {
      fullName: newMemberFullName.trim(),
      residence: newMemberResidence.trim(),
      prayerCell: newMemberPrayerCell.trim(),
      phone: newMemberPhone.trim(),
      email: newMemberEmail.trim(),
      membership: newMemberMembership,
      baptized: newMemberBaptized,
      attendance: [],
    };
    try {
      await addMemberToClass(selectedClassId, newMemberData);
      showSnackbar('Member added successfully!');
      handleCloseAddMemberModal();
    } catch (error) {
      console.error("Error adding member:", error);
      setMemberModalError('Error adding member, please try again.');
    }
  };

  // ---------------------------
  // RENDERING
  // ---------------------------
  if (loading) {
    return <Typography variant="h6">Loading classes...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Button to add a new class */}
      <Button variant="contained" color="primary" onClick={handleOpenAddClassModal} sx={{ mb: 2 }}>
        Add New Class
      </Button>

      {/* Filter Section */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
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
      </Box>

      {/* Classes Summary Table */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddMemberModal(cls.id);
                      }}
                      sx={{ mb: 1, mr: 1 }}
                    >
                      Add Member
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditClassModal(cls);
                      }}
                      startIcon={<EditIcon />}
                      sx={{ mb: 1, mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id, cls.name);
                      }}
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

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog}>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <DialogContentText>{confirmDialog.message}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
            <Button onClick={handleConfirmAction} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
      />

      {/* Modal for Adding a New Class */}
      <Modal
        open={openAddClassModal}
        onClose={handleCloseAddClassModal}
        aria-labelledby="add-class-modal-title"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="add-class-modal-title" variant="h6" component="h2">
            Add New Class
          </Typography>
          <TextField
            label="Class Name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <TextField
            label="Teacher"
            value={newClassTeacher}
            onChange={(e) => setNewClassTeacher(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <TextField
            label="Elder (Optional)"
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
          <Button variant="contained" onClick={handleCreateClass} fullWidth sx={{ mt: 2 }}>
            Create Class
          </Button>
        </Box>
      </Modal>

      {/* Modal for Editing Class */}
      <Modal
        open={openEditClassModal}
        onClose={handleCloseEditClassModal}
        aria-labelledby="edit-class-modal-title"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="edit-class-modal-title" variant="h6" component="h2">
            Edit Class Details
          </Typography>
          <TextField
            label="Class Name"
            value={editClassName}
            onChange={(e) => setEditClassName(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <TextField
            label="Teacher"
            value={editClassTeacher}
            onChange={(e) => setEditClassTeacher(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <TextField
            label="Elder (Optional)"
            value={editClassElder}
            onChange={(e) => setEditClassElder(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Button variant="contained" onClick={handleUpdateClass} fullWidth sx={{ mt: 2 }}>
            Update Class
          </Button>
        </Box>
      </Modal>

      {/* Modal for Adding a New Member (Admin-Only) */}
      <Modal
        open={openAddMemberModal}
        onClose={handleCloseAddMemberModal}
        aria-labelledby="add-member-modal-title"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="add-member-modal-title" variant="h6" component="h2">
            Add New Member
          </Typography>
          <TextField
            label="Full Name"
            value={newMemberFullName}
            onChange={(e) => setNewMemberFullName(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <TextField
            label="Residence"
            value={newMemberResidence}
            onChange={(e) => setNewMemberResidence(e.target.value)}
            fullWidth
            required
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
            label="Phone Number"
            value={newMemberPhone}
            onChange={(e) => setNewMemberPhone(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <TextField
            label="Email Address"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            fullWidth
            required
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Membership</InputLabel>
            <Select
              value={newMemberMembership}
              label="Membership"
              onChange={(e) => setNewMemberMembership(e.target.value)}
            >
              <MenuItem value="Member">Member</MenuItem>
              <MenuItem value="Visitor">Visitor</MenuItem>
            </Select>
          </FormControl>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Baptized</FormLabel>
            <RadioGroup row value={newMemberBaptized} onChange={(e) => setNewMemberBaptized(e.target.value)}>
              <FormControlLabel value="Baptized" control={<Radio />} label="Baptized" />
              <FormControlLabel value="Not Baptized" control={<Radio />} label="Not Baptized" />
            </RadioGroup>
          </FormControl>
          {memberModalError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {memberModalError}
            </Typography>
          )}
          <Button variant="contained" onClick={handleAddMember} fullWidth sx={{ mt: 2 }}>
            Add Member
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;
