// src/components/AdminDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Modal,
  TextField,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  GetApp as GetAppIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
} from '@mui/icons-material';
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
import AttendanceChart from './AttendanceChart'; // For performance chart

// ——— Helpers ———
const calculateSummary = (cls) => {
  const members = cls.members || [];
  const mCount = members.length;
  const lessons = members[0]?.attendance?.length || 0;
  const attended = members.reduce(
    (sum, m) => sum + (m.attendance?.filter(Boolean).length || 0),
    0
  );
  const possible = mCount * lessons;
  return {
    totalMembers: mCount,
    totalLessons: lessons,
    attendanceRate: possible ? ((attended / possible) * 100).toFixed(2) : 'N/A',
  };
};

const toCSV = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${row[h] || ''}"`).join(',')
    ),
  ];
  return rows.join('\n');
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};

// ——— Main Component ———
const AdminDashboard = () => {
  const navigate = useNavigate();

  // — State
  const [classes, setClasses] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);

  // Snack & Confirm
  const [snack, setSnack] = useState({ open: false, msg: '' });
  const [confirm, setConfirm] = useState({ open: false, onOk: null, title: '', text: '' });

  // Add/Edit Class
  const [addClsOpen, setAddClsOpen] = useState(false);
  const [editClsOpen, setEditClsOpen] = useState(false);
  const [clsForm, setClsForm] = useState({ id: '', name: '', teacher: '', elder: '' });
  const [clsError, setClsError] = useState('');

  // Add Member
  const [addMemOpen, setAddMemOpen] = useState(false);
  const [memForm, setMemForm] = useState({
    classId: '',
    fullName: '',
    residence: '',
    prayerCell: '',
    phone: '',
    email: '',
    membership: 'Member',
    baptized: 'Not Baptized',
  });
  const [memError, setMemError] = useState('');

  // Reporting
  const [reportMode, setReportMode] = useState('month');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [records, setRecords] = useState([]);

  // New state for toggling performance chart dropdown
  const [showChart, setShowChart] = useState(false);

  // — Fetch classes real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // — UI helpers
  const openSnack = (msg) => setSnack({ open: true, msg });
  const openConfirm = (title, text, onOk) => setConfirm({ open: true, title, text, onOk });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));

  // — Class CRUD
  const handleSaveClass = async () => {
    if (!clsForm.name.trim() || !clsForm.teacher.trim()) {
      setClsError('Name & teacher are required');
      return;
    }
    try {
      if (editClsOpen) {
        await updateClass(clsForm.id, {
          name: clsForm.name,
          teacher: clsForm.teacher,
          elder: clsForm.elder,
        });
        openSnack('Class updated');
      } else {
        await addNewClass({
          name: clsForm.name,
          teacher: clsForm.teacher,
          elder: clsForm.elder,
          classType: 'Church Service',
          members: [],
        });
        openSnack('Class added');
      }
      setClsError('');
      setAddClsOpen(false);
      setEditClsOpen(false);
    } catch {
      setClsError('Error saving class');
    }
  };

  const handleDeleteClass = (id, name) =>
    openConfirm(`Delete "${name}"?`, 'This action cannot be undone.', async () => {
      await deleteClass(id);
      openSnack('Class deleted');
      closeConfirm();
    });

  // — Member CRUD
  const handleSaveMember = async () => {
    const { classId, fullName, phone, email } = memForm;
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setMemError('Name, phone & email are required');
      return;
    }
    try {
      await addMemberToClass(classId, {
        fullName,
        residence: memForm.residence,
        prayerCell: memForm.prayerCell,
        phone,
        email,
        membership: memForm.membership,
        baptized: memForm.baptized,
        attendance: [],
      });
      openSnack('Member added');
      setAddMemOpen(false);
      setMemError('');
    } catch {
      setMemError('Error adding member');
    }
  };

  // — Reporting
  const fetchRecords = async () => {
    const col = collectionGroup(db, 'attendanceRecords');
    const qRef =
      reportMode === 'month'
        ? query(col, where('year', '==', reportYear), where('month', '==', reportMonth))
        : query(col, where('year', '==', reportYear));
    const snap = await getDocs(qRef);
    setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };
  const downloadReport = () => {
    const csv = toCSV(records);
    const fn = reportMode === 'month'
      ? `attendance-${reportYear}-${reportMonth}.csv`
      : `attendance-${reportYear}.csv`;
    downloadCSV(csv, fn);
  };

  // Compute chart-friendly data from attendance records.
  // Each record is expected to include: year, month, saturdays, and members (with their attendance arrays)
  const chartData = useMemo(() => {
    return records
      .map((rec) => {
        const totalLessons = rec.saturdays?.length || 0;
        const totalMembers = rec.members?.length || 0;
        const totalAttendances =
          rec.members?.reduce(
            (sum, m) => sum + (m.attendance?.filter((x) => x).length || 0),
            0
          ) || 0;
        const rate =
          totalLessons * totalMembers > 0
            ? Number(((totalAttendances / (totalLessons * totalMembers)) * 100).toFixed(2))
            : 0;
        return { month: `${rec.month}/${rec.year}`, attendanceRate: rate };
      })
      .sort((a, b) => {
        const [mA, yA] = a.month.split('/').map(Number);
        const [mB, yB] = b.month.split('/').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
      });
  }, [records]);

  if (loading) return <Typography>Loading…</Typography>;

  // — Filtered classes
  const filtered = classes.filter(
    (c) => filterType === 'All' || c.classType === filterType
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* — Class Toolbar — */}
      <Grid container spacing={2} mb={2}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setClsForm({ id: '', name: '', teacher: '', elder: '' });
              setAddClsOpen(true);
            }}
          >
            New Class
          </Button>
        </Grid>
        <Grid item>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Class Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Class Type"
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Church Service">Church Service</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* — Classes Table — */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Class</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Elder</TableCell>
              <TableCell># Members</TableCell>
              <TableCell># Lessons</TableCell>
              <TableCell>Attendance %</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((c) => {
              const { totalMembers, totalLessons, attendanceRate } =
                calculateSummary(c);
              return (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.teacher}</TableCell>
                  <TableCell>{c.elder}</TableCell>
                  <TableCell>{totalMembers}</TableCell>
                  <TableCell>{totalLessons}</TableCell>
                  <TableCell>{attendanceRate}%</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<PersonAddIcon />}
                      onClick={() => {
                        setMemForm({ ...memForm, classId: c.id });
                        setAddMemOpen(true);
                      }}
                    >
                      Add Member
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setClsForm({
                          id: c.id,
                          name: c.name,
                          teacher: c.teacher,
                          elder: c.elder,
                        });
                        setEditClsOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClass(c.id, c.name)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      startIcon={<GroupIcon />}
                      onClick={() => navigate(`/admin/members/${c.id}`)}
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

      {/* — Confirm Dialog — */}
      <Dialog open={confirm.open} onClose={closeConfirm}>
        <DialogTitle>{confirm.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm.text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button color="error" onClick={confirm.onOk}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* — Snack — */}
      <Snackbar
        open={snack.open}
        message={snack.msg}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      />

      {/* — Add/Edit Class Modal — */}
      <Modal
        open={addClsOpen || editClsOpen}
        onClose={() => {
          setAddClsOpen(false);
          setEditClsOpen(false);
        }}
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>
            {editClsOpen ? 'Edit Class' : 'New Class'}
          </Typography>
          <TextField
            fullWidth
            label="Name"
            value={clsForm.name}
            onChange={(e) =>
              setClsForm((f) => ({ ...f, name: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Teacher"
            value={clsForm.teacher}
            onChange={(e) =>
              setClsForm((f) => ({ ...f, teacher: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Elder (opt.)"
            value={clsForm.elder}
            onChange={(e) =>
              setClsForm((f) => ({ ...f, elder: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          {clsError && <Typography color="error">{clsError}</Typography>}
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveClass}
            sx={{ mt: 2 }}
          >
            {editClsOpen ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Modal>

      {/* — Add Member Modal — */}
      <Modal open={addMemOpen} onClose={() => setAddMemOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>
            Add Member
          </Typography>
          <TextField
            fullWidth
            label="Full Name"
            value={memForm.fullName}
            onChange={(e) =>
              setMemForm((f) => ({ ...f, fullName: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Residence"
            value={memForm.residence}
            onChange={(e) =>
              setMemForm((f) => ({ ...f, residence: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Prayer Cell"
            value={memForm.prayerCell}
            onChange={(e) =>
              setMemForm((f) => ({ ...f, prayerCell: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={memForm.phone}
            onChange={(e) =>
              setMemForm((f) => ({ ...f, phone: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={memForm.email}
            onChange={(e) =>
              setMemForm((f) => ({ ...f, email: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Membership</InputLabel>
            <Select
              value={memForm.membership}
              onChange={(e) =>
                setMemForm((f) => ({ ...f, membership: e.target.value }))
              }
              label="Membership"
            >
              <MenuItem value="Member">Member</MenuItem>
              <MenuItem value="Visitor">Visitor</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ mb: 2 }}>
            <RadioGroup
              row
              value={memForm.baptized}
              onChange={(e) =>
                setMemForm((f) => ({ ...f, baptized: e.target.value }))
              }
            >
              <FormControlLabel
                value="Baptized"
                control={<Radio />}
                label="Baptized"
              />
              <FormControlLabel
                value="Not Baptized"
                control={<Radio />}
                label="Not Baptized"
              />
            </RadioGroup>
          </FormControl>
          {memError && <Typography color="error">{memError}</Typography>}
          <Button variant="contained" fullWidth onClick={handleSaveMember}>
            Add Member
          </Button>
        </Box>
      </Modal>

      {/* — Reporting — */}
      <Box mt={4} pt={3} borderTop="1px solid #ccc">
        <Typography variant="h5" gutterBottom>
          Attendance Reports
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={reportMode}
                onChange={(e) => setReportMode(e.target.value)}
                label="Mode"
              >
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <TextField
              label="Year"
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(+e.target.value)}
              sx={{ width: 100 }}
            />
          </Grid>
          {reportMode === 'month' && (
            <Grid item>
              <TextField
                label="Month"
                type="number"
                value={reportMonth}
                onChange={(e) => setReportMonth(+e.target.value)}
                sx={{ width: 100 }}
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
          )}
          <Grid item>
            <Button variant="contained" startIcon={<GetAppIcon />} onClick={fetchRecords}>
              Fetch Report
            </Button>
          </Grid>
        </Grid>
        {records.length > 0 && (
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1">
              {`Found ${records.length} record${records.length > 1 ? 's' : ''} for the selected ${reportMode === 'month' ? 'month' : 'year'}.`}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={downloadReport}
              sx={{ mt: 2, mr: 2 }}
            >
              Download CSV
            </Button>
            {/* Dropdown Button to toggle performance chart */}
            <Button
              variant="contained"
              onClick={() => setShowChart(!showChart)}
              sx={{ mt: 2 }}
            >
              {showChart ? 'Hide Performance Chart' : 'Show Performance Chart'}
            </Button>
            {showChart && (
              <Box sx={{ mt: 3 }}>
                <AttendanceChart data={chartData} />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;

// Shared modal styling
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};