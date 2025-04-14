// src/components/AdminDashboard.js
import React, { useState } from 'react';
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

// Updated sample data with new classes
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
    name: 'Judea',
    teacher: 'Teacher Judea',
    elder: 'Elder Judea',
    classType: 'Church Service',
    members: [
      { fullName: 'David', attendance: [true, true, true, true] },
      { fullName: 'Eve', attendance: [false, true, true, false] },
    ],
  },
  {
    id: 'galilee',
    name: 'Galilee',
    teacher: 'Teacher Galilee',
    elder: 'Elder Galilee',
    classType: 'Church Service',
    members: [
      { fullName: 'Frank', attendance: [true, false, false, false] },
      { fullName: 'Grace', attendance: [true, true, true, false] },
    ],
  },
  {
    id: 'samaria',
    name: 'Samaria',
    teacher: 'Teacher Samaria',
    elder: 'Elder Samaria',
    classType: 'Church Service',
    members: [
      { fullName: 'Hank', attendance: [false, true, true, false] },
      { fullName: 'Ivy', attendance: [true, true, false, true] },
    ],
  },
  {
    id: 'nazareth',
    name: 'Nazareth',
    teacher: 'Teacher Nazareth',
    elder: 'Elder Nazareth',
    classType: 'Church Service',
    members: [
      { fullName: 'Jack', attendance: [true, false, true, true] },
      { fullName: 'Karen', attendance: [true, true, false, false] },
    ],
  },
  {
    id: 'baptismal',
    name: 'Baptismal',
    teacher: 'Teacher Baptismal',
    elder: 'Elder Baptismal',
    classType: 'Church Service',
    members: [
      { fullName: 'Leo', attendance: [true, true, true, false] },
      { fullName: 'Mia', attendance: [false, false, true, true] },
    ],
  },
  {
    id: 'jerusalem',
    name: 'Jerusalem',
    teacher: 'Teacher Jerusalem',
    elder: 'Elder Jerusalem',
    classType: 'Church Service',
    members: [
      { fullName: 'Noah', attendance: [true, true, true, true] },
      { fullName: 'Olivia', attendance: [true, false, true, false] },
    ],
  },
];

const calculateClassAttendanceSummary = (classData) => {
  const { members } = classData;
  const totalMembers = members.length;
  const totalLessons = members[0] ? members[0].attendance.length : 0;
  let totalAttendances = 0;
  members.forEach(member => {
    totalAttendances += member.attendance.filter(x => x).length;
  });
  const possibleAttendances = totalMembers * totalLessons;
  const attendanceRate = possibleAttendances > 0
    ? ((totalAttendances / possibleAttendances) * 100).toFixed(2)
    : 'N/A';
  return { totalMembers, totalLessons, totalAttendances, attendanceRate };
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Filter states for class type and dates
  const [filterClassType, setFilterClassType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredData = sampleData.filter(cls => {
    if (filterClassType === 'All') return true;
    return cls.classType === filterClassType;
  });

  let aggregatedMembers = 0;
  let aggregatedAttendances = 0;
  let aggregatedPossible = 0;
  filteredData.forEach(cls => {
    const { totalMembers, totalLessons, totalAttendances } = calculateClassAttendanceSummary(cls);
    aggregatedMembers += totalMembers;
    aggregatedAttendances += totalAttendances;
    aggregatedPossible += totalMembers * totalLessons;
  });
  const overallAttendanceRate = aggregatedPossible > 0
    ? ((aggregatedAttendances / aggregatedPossible) * 100).toFixed(2)
    : 'N/A';

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Filters Section */}
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
                  <TableCell>{totalMembers}</TableCell>
                  <TableCell>{totalLessons}</TableCell>
                  <TableCell>{totalAttendances}</TableCell>
                  <TableCell>{attendanceRate}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminDashboard;