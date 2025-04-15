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
  TextField,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Sample data for classes (you might replace this with Firestore data later)
const sampleData = [
  {
    id: 'bethlehem',
    name: 'Bethlehem Class',
    teacher: 'Teacher Bethlehem',
    elder: 'Elder Bethlehem',
    classType: 'Church Service',
    members: [
      { fullName: 'Alice', attendance: [true, false, true, true] },
      { fullName: 'Bob', attendance: [true, true, false, true] },
      { fullName: 'Charlie', attendance: [false, false, true, false] },
    ],
  },
  {
    id: 'judea',
    name: 'Judea Class',
    teacher: 'Teacher Judea',
    elder: 'Elder Judea',
    classType: 'Church Service',
    members: [
      { fullName: 'David', attendance: [true, true, true, true] },
      { fullName: 'Eve', attendance: [false, true, true, false] },
    ],
  },
  // ... Additional classes as needed
];

const calculateClassAttendanceSummary = (classData) => {
  const { members } = classData;
  const totalMembers = members.length;
  const totalLessons = members[0] ? members[0].attendance.length : 0;
  let totalAttendances = 0;
  members.forEach((member) => {
    totalAttendances += member.attendance.filter((x) => x).length;
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

  // Filter states for classes
  const [filterClassType, setFilterClassType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Classes state — using static sampleData; later replace with dynamic Firestore data.
  const [classesData, setClassesData] = useState(sampleData);

  // State for User Role Management.
  const [users, setUsers] = useState([]);

  // Fetch users from Firestore on component mount.
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Handle role change updates.
  const handleRoleChange = async (userId, newRole) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Filter classes based on class type (and date filters as needed)
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

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Filters Section for Classes */}
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
        <Grid item xs={12} md={3}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Button variant="contained" fullWidth>
            Apply Filters
          </Button>
        </Grid>
      </Grid>

      {/* Overview Cards for Classes */}
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
                  {/* Show member count */}
                  <TableCell>{totalMembers}</TableCell>
                  {/* Show all member names (comma-separated) */}
                  <TableCell>
                    {cls.members.map((member) => member.fullName).join(', ')}
                  </TableCell>
                  <TableCell>{totalLessons}</TableCell>
                  <TableCell>{totalAttendances}</TableCell>
                  <TableCell>{attendanceRate}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Role Management Section */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '40px' }}>
        User Role Management
      </Typography>
      <TableContainer component={Paper} style={{ marginBottom: '40px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Current Role</TableCell>
              <TableCell>Change Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="teacher">Teacher</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminDashboard;