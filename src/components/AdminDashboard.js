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
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { addMemberToClass, addNewClass, deleteMemberFromClass, deleteClass } from '../firebaseHelpers';
import MarkSaturdayAttendance from './MarkSaturdayAttendance';

const calculateClassAttendanceSummary = (classData) => {
  const { members } = classData;
  const totalMembers = members?.length || 0;
  const totalLessons = members?.[0]?.attendance?.length || 0;
  let totalAttendances = 0;
  members?.forEach((member) => {
    totalAttendances += member.attendance?.filter((x) => x).length || 0;
  });
  const possibleAttendances = totalMembers * totalLessons;
  const attendanceRate =
    possibleAttendances > 0
      ? ((totalAttendances / possibleAttendances) * 100).toFixed(2)
      : 'N/A';
  return { totalMembers, totalLessons, totalAttendances, attendanceRate };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filterClassType, setFilterClassType] = useState('All');
  const [classesData, setClassesData] = useState([]);

  // Snackbar state for confirmation messages.
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // State for Add Member modal.
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [newMemberFullName, setNewMemberFullName] = useState('');
  const [newMemberResidence, setNewMemberResidence] = useState('');
  const [newMemberPrayerCell, setNewMemberPrayerCell] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberMembership, setNewMemberMembership] = useState('Member');
  const [newMemberBaptized, setNewMemberBaptized] = useState('Not Baptized');
  const [modalError, setModalError] = useState('');

  // State for Add New Class modal.
  const [openAddClassModal, setOpenAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassElder, setNewClassElder] = useState('');
  const [classModalError, setClassModalError] = useState('');

  // State for Attendance Modal (for marking register).
  const [openAttendanceModal, setOpenAttendanceModal] = useState(false);
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState(null);

  // ---- Confirmation Dialog State ----
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
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

  // Fetch classes data from Firestore.
  const fetchClasses = async () => {
    try {
      const classesCollection = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesCollection);
      const classesList = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClassesData(classesList);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredData = classesData.filter((cls) => {
    if (filterClassType === 'All') return true;
    return cls.classType === filterClassType;
  });

  let aggregatedMembers = 0;
  let aggregatedAttendances = 0;
  let aggregatedPossible = 0;
  filteredData.forEach((cls) => {
    const { totalMembers, totalLessons, totalAttendances } =
      calculateClassAttendanceSummary(cls);
    aggregatedMembers += totalMembers;
    aggregatedAttendances += totalAttendances;
    aggregatedPossible += totalMembers * totalLessons;
  });
  const overallAttendanceRate =
    aggregatedPossible > 0
      ? ((aggregatedAttendances / aggregatedPossible) * 100).toFixed(2)
      : 'N/A';

  // ---------- Add Member Modal Functions ----------
  const handleOpenAddMemberModal = (classId) => {
    setSelectedClassId(classId);
    setOpenAddMemberModal(true);
  };

  const handleCloseAddMemberModal = () => {
    setOpenAddMemberModal(false);
    setSelectedClassId(null);
    setNewMemberFullName('');
    setNewMemberResidence('');
    setNewMemberPrayerCell('');
    setNewMemberPhone('');
    setNewMemberEmail('');
    setNewMemberMembership('Member');
    setNewMemberBaptized('Not Baptized');
    setModalError('');
  };

  const handleAddMember = async () => {
    if (
      !newMemberFullName.trim() ||
      !newMemberResidence.trim() ||
      !newMemberPhone.trim() ||
      !newMemberEmail.trim()
    ) {
      setModalError('Please fill out all required fields.');
      return;
    }
    // Duplicate check using email as unique identifier.
    const selectedClass = classesData.find((cls) => cls.id === selectedClassId);
    if (
      selectedClass &&
      selectedClass.members &&
      selectedClass.members.some(
        (member) =>
          member.email.toLowerCase() === newMemberEmail.trim().toLowerCase()
      )
    ) {
      setModalError('Member already exists in this class.');
      return;
    }

    const newMember = {
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
      await addMemberToClass(selectedClassId, newMember);
      setSnackbarMessage('Member added successfully!');
      setSnackbarOpen(true);
      await fetchClasses();
      handleCloseAddMemberModal();
    } catch (error) {
      console.error(error);
      setModalError('Error adding member, please try again.');
    }
  };

  // ---------- Add New Class Modal Functions ----------
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
      await fetchClasses();
      handleCloseAddClassModal();
    } catch (error) {
      setClassModalError('Error creating class, please try again.');
      console.error(error);
    }
  };

  // ---------- Attendance Modal Functions (for Admin) ----------
  const handleOpenAttendanceModal = (cls) => {
    setSelectedAttendanceClass(cls);
    setOpenAttendanceModal(true);
  };

  const handleCloseAttendanceModal = () => {
    setOpenAttendanceModal(false);
    setSelectedAttendanceClass(null);
  };

  // ---------- Delete Functions using Confirmation Dialog ----------
  const handleDeleteMember = (classId, member) => {
    openConfirmDialog(
      'Delete Member',
      `Are you sure you want to delete member "${member.fullName}"?`,
      async () => {
        try {
          await deleteMemberFromClass(classId, member);
          setSnackbarMessage('Member deleted successfully!');
          setSnackbarOpen(true);
          await fetchClasses();
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
          await fetchClasses();
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

      {/* Button to Add New Class */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenAddClassModal}
        sx={{ mb: 2 }}
      >
        Add New Class
      </Button>

      {/* Filter Section */}
      <Grid container spacing={2} style={{ marginBottom: '20px' }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
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
        </Grid>
      </Grid>

      {/* Overview Cards */}
      <Grid container spacing={3} style={{ marginBottom: '20px' }}>
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
              <Typography variant="h4">{aggregatedMembers}</Typography>
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
                        <div
                          key={index}
                          style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}
                        >
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
                        handleOpenAddMemberModal(cls.id);
                      }}
                      sx={{ mb: 1 }}
                    >
                      Add Member
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAttendanceModal(cls);
                      }}
                      sx={{ mb: 1 }}
                    >
                      Mark Attendance
                    </Button>
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

      {/* Modal for Adding a New Member */}
      <Modal
        open={openAddMemberModal}
        onClose={handleCloseAddMemberModal}
        aria-labelledby="add-member-modal-title"
        aria-describedby="add-member-modal-description"
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
            <RadioGroup
              row
              value={newMemberBaptized}
              onChange={(e) => setNewMemberBaptized(e.target.value)}
            >
              <FormControlLabel value="Baptized" control={<Radio />} label="Baptized" />
              <FormControlLabel value="Not Baptized" control={<Radio />} label="Not Baptized" />
            </RadioGroup>
          </FormControl>
          {modalError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {modalError}
            </Typography>
          )}
          <Button variant="contained" onClick={handleAddMember} sx={{ mt: 2 }} fullWidth>
            Submit
          </Button>
        </Box>
      </Modal>

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

      {/* Modal for Marking Attendance (for Admin) */}
      <Modal
        open={openAttendanceModal}
        onClose={handleCloseAttendanceModal}
        aria-labelledby="attendance-modal-title"
        aria-describedby="attendance-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            overflowY: 'auto',
          }}
        >
          {selectedAttendanceClass && (
            <MarkSaturdayAttendance
              classData={selectedAttendanceClass}
              onAttendanceMarked={() => {
                fetchClasses();
                handleCloseAttendanceModal();
              }}
            />
          )}
        </Box>
      </Modal>

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
    </div>
  );
};

export default AdminDashboard;