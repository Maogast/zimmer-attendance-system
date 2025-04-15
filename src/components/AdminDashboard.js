// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
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
  IconButton,
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
  addMemberToClass,
  addNewClass,
  updateClass,
  deleteMemberFromClass,
  deleteClass,
} from '../firebaseHelpers';

const calculateClassAttendanceSummary = (classData) => {
  const { members } = classData;
  const totalMembers = members?.length || 0;
  const totalLessons = members && members.length > 0 ? members[0].attendance?.length || 0 : 0;
  let totalAttendances = 0;
  members?.forEach((member) => {
    totalAttendances += member.attendance?.filter((x) => x).length || 0;
  });
  const possibleAttendances = totalMembers * totalLessons;
  const attendanceRate = possibleAttendances > 0
    ? ((totalAttendances / possibleAttendances) * 100).toFixed(2)
    : 'N/A';
  return { totalMembers, totalLessons, totalAttendances, attendanceRate };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filterClassType, setFilterClassType] = useState('All');
  const [classesData, setClassesData] = useState([]);

  // Snackbar for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Add New Class Modal
  const [openAddClassModal, setOpenAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassElder, setNewClassElder] = useState('');
  const [classModalError, setClassModalError] = useState('');

  // Edit Class Modal State
  const [openEditClassModal, setOpenEditClassModal] = useState(false);
  const [editClassId, setEditClassId] = useState(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editClassElder, setEditClassElder] = useState('');

  // Confirmation Dialog State (for delete actions)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    handleCloseDialog();
  };

  // Real-time listener to fetch classes
  useEffect(() => {
    const classesCollection = collection(db, 'classes');
    const unsubscribe = onSnapshot(classesCollection, (snapshot) => {
      const classesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClassesData(classesList);
    }, (error) => {
      console.error('Error fetching real-time classes:', error);
    });
    return () => unsubscribe();
  }, []);

  const filteredData = classesData.filter((cls) => {
    return filterClassType === 'All' ? true : cls.classType === filterClassType;
  });

  let aggregatedMembers = 0;
  let aggregatedAttendances = 0;
  let aggregatedPossible = 0;
  filteredData.forEach((cls) => {
    const { totalMembers, totalLessons, totalAttendances } = calculateClassAttendanceSummary(cls);
    aggregatedMembers += totalMembers;
    aggregatedAttendances += totalAttendances;
    aggregatedPossible += totalMembers * totalLessons;
  });
  const overallAttendanceRate = aggregatedPossible > 0
    ? ((aggregatedAttendances / aggregatedPossible) * 100).toFixed(2)
    : 'N/A';

  // ---------- Add New Class Functions ----------
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
      setClassModalError('Please enter a class name and teacher');
      return;
    }
    const newClassData = {
      name: newClassName.trim(),
      teacher: newClassTeacher.trim(),
      elder: newClassElder.trim() || '',
      classType: 'Church Service',
      members: [],
    };
    try {
      await addNewClass(newClassData);
      setSnackbarMessage('Class added successfully!');
      setSnackbarOpen(true);
      handleCloseAddClassModal();
    } catch (error) {
      setClassModalError('Error creating class, please try again.');
      console.error(error);
    }
  };

  // ---------- Edit Class Functions ----------
  const handleOpenEditClassModal = (cls) => {
    setEditClassId(cls.id);
    setEditClassName(cls.name);
    setEditClassTeacher(cls.teacher);
    setEditClassElder(cls.elder);
    setOpenEditClassModal(true);
  };

  const handleCloseEditClassModal = () => {
    setOpenEditClassModal(false);
    setEditClassId(null);
    setEditClassName('');
    setEditClassTeacher('');
    setEditClassElder('');
  };

  const handleUpdateClass = async () => {
    if (!editClassName.trim() || !editClassTeacher.trim()) {
      alert('Please enter a class name and teacher.');
      return;
    }
    try {
      await updateClass(editClassId, {
        name: editClassName.trim(),
        teacher: editClassTeacher.trim(),
        elder: editClassElder.trim() || '',
      });
      setSnackbarMessage('Class updated successfully!');
      setSnackbarOpen(true);
      handleCloseEditClassModal();
    } catch (error) {
      alert('Error updating class, please try again.');
    }
  };

  // ---------- Delete Functions (Member and Class) ----------
  const handleDeleteMember = (classId, member) => {
    openConfirmDialog(
      'Delete Member',
      `Are you sure you want to delete member "${member.fullName}"?`,
      async () => {
        try {
          await deleteMemberFromClass(classId, member);
          setSnackbarMessage('Member deleted successfully!');
          setSnackbarOpen(true);
        } catch (error) {
          console.error(error);
        }
      }
    );
  };

  const handleDeleteClass = (classId, className) => {
    openConfirmDialog(
      'Delete Class',
      `Are you sure you want to delete the class "${className}"?`,
      async () => {
        try {
          await deleteClass(classId);
          setSnackbarMessage('Class deleted successfully!');
          setSnackbarOpen(true);
        } catch (error) {
          console.error(error);
        }
      }
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Buttons for New Class */}
      <Button variant="contained" color="primary" onClick={handleOpenAddClassModal} sx={{ mb: 2, mr: 2 }}>
        Add New Class
      </Button>

      {/* Filter Section */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Class Type</InputLabel>
            <Select value={filterClassType} label="Class Type" onChange={(e) => setFilterClassType(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Church Service">Church Service</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Classes</Typography>
              <Typography variant="h4">{filteredData.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Members</Typography>
              <Typography variant="h4">{filteredData.reduce((acc, cls) => acc + (cls.members?.length || 0), 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Overall Attendance Rate</Typography>
              <Typography variant="h4">{overallAttendanceRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Classes Summary Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Elder</TableCell>
              <TableCell>Class Type</TableCell>
              <TableCell>Total Members</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Total Lessons</TableCell>
              <TableCell>Total Attendances</TableCell>
              <TableCell>Attendance Rate (%)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((cls) => {
              const { totalMembers, totalLessons, totalAttendances, attendanceRate } =
                calculateClassAttendanceSummary(cls);
              return (
                <TableRow
                  key={cls.id}
                  hover
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/attendance/${cls.id}`)}
                >
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.teacher}</TableCell>
                  <TableCell>{cls.elder}</TableCell>
                  <TableCell>{cls.classType}</TableCell>
                  <TableCell>{totalMembers}</TableCell>
                  <TableCell>
                    {cls.members && cls.members.length > 0 ? (
                      cls.members.map((member, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                          <span>{member.fullName}</span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMember(cls.id, member);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      ))
                    ) : (
                      'No members'
                    )}
                  </TableCell>
                  <TableCell>{totalLessons}</TableCell>
                  <TableCell>{totalAttendances}</TableCell>
                  <TableCell>{attendanceRate}%</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open Add Member Modal for this class
                        // (Handled within the Add Member modal in a different component or via a separate function)
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
                        navigate(`/attendance-tracker/${cls.id}`);
                      }}
                      sx={{ mb: 1, mr: 1 }}
                    >
                      Mark Attendance
                    </Button>
                    <IconButton
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditClassModal(cls);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id, cls.name);
                      }}
                    >
                      Delete Class
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Confirmation Messages */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {/* Modal for Adding a New Class */}
      <Modal
        open={openAddClassModal}
        onClose={handleCloseAddClassModal}
        aria-labelledby="add-class-modal-title"
        aria-describedby="add-class-modal-description"
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
          <Button variant="contained" onClick={handleCreateClass} sx={{ mt: 2 }} fullWidth>
            Create Class
          </Button>
        </Box>
      </Modal>

      {/* Modal for Editing Class */}
      <Modal
        open={openEditClassModal}
        onClose={handleCloseEditClassModal}
        aria-labelledby="edit-class-modal-title"
        aria-describedby="edit-class-modal-description"
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
          <Button variant="contained" onClick={handleUpdateClass} sx={{ mt: 2 }} fullWidth>
            Update Class
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default AdminDashboard;