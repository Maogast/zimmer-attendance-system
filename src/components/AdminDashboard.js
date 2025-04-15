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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { addMemberToClass, addNewClass } from '../firebaseHelpers';

// Utility function to calculate attendance metrics for a given class.
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

  // State for "Add Member" modal is still here for existing classes.
  const [openAddMemberModal, setOpenAddMemberModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [modalError, setModalError] = useState('');

  // STATE for "Add New Class" modal
  const [openAddClassModal, setOpenAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newClassElder, setNewClassElder] = useState('');
  const [classModalError, setClassModalError] = useState('');

  // Function to fetch classes from Firestore.
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

  // Fetch classes on component mount.
  useEffect(() => {
    fetchClasses();
  }, []);

  // Filter classes based on the selected class type.
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

  // --------------------------
  // Functions for "Add Member" modal (for existing classes)
  const handleOpenAddMemberModal = (classId) => {
    setSelectedClassId(classId);
    setOpenAddMemberModal(true);
  };

  const handleCloseAddMemberModal = () => {
    setOpenAddMemberModal(false);
    setSelectedClassId(null);
    setNewMemberName('');
    setModalError('');
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setModalError('Please enter a member name');
      return;
    }
    try {
      const newMember = {
        fullName: newMemberName.trim(),
        attendance: [],
      };
      await addMemberToClass(selectedClassId, newMember);
      await fetchClasses();
      handleCloseAddMemberModal();
    } catch (error) {
      setModalError('Error adding member, please try again.');
      console.error(error);
    }
  };

  // --------------------------
  // Functions for "Add New Class" modal
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
      elder: newClassElder.trim() || '', // optional
      classType: 'Church Service', // fixed value; change as needed
      members: [],
    };
    try {
      await addNewClass(newClassData);
      await fetchClasses();
      handleCloseAddClassModal();
    } catch (error) {
      setClassModalError('Error creating class, please try again.');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Add New Class Button */}
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
              {/* Add additional class types if needed */}
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
                    {cls.members
                      ? cls.members.map((member) => member.fullName).join(', ')
                      : 'No members'}
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
                    >
                      Add Member
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
            width: 350,
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
            label="Member Name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          {modalError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {modalError}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleAddMember}
            sx={{ mt: 2 }}
            fullWidth
          >
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
          <Button
            variant="contained"
            onClick={handleCreateClass}
            sx={{ mt: 2 }}
            fullWidth
          >
            Create Class
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default AdminDashboard;