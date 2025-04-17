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

// Calculates summary stats for a class.
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

// Updated CSV converter: if the header is 'members',
// it will extract each member's name and join them with "; ".
const toCSV = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','), // CSV header row.
    ...data.map((row) =>
      headers
        .map((h) => {
          let cell = row[h] || '';
          if (h === 'members' && Array.isArray(cell)) {
            cell = cell
              .map((member) => member.fullName || member.name || '')
              .filter((name) => name !== '')
              .join('; ');
          }
          return `"${cell}"`;
        })
        .join(',')
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

  // Snack & Confirm dialogs.
  const [snack, setSnack] = useState({ open: false, msg: '' });
  const [confirm, setConfirm] = useState({ open: false, onOk: null, title: '', text: '' });

  // Add/Edit Class state.
  const [addClsOpen, setAddClsOpen] = useState(false);
  const [editClsOpen, setEditClsOpen] = useState(false);
  const [clsForm, setClsForm] = useState({ id: '', name: '', teacher: '', elder: '' });
  const [clsError, setClsError] = useState('');

  // Add Member state.
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

  // Reporting state.
  const [reportMode, setReportMode] = useState('month');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  // For reporting, we use 1–12 for admin input even though data is stored as 0–11.
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [records, setRecords] = useState([]);

  // Toggle performance chart dropdown.
  const [showChart, setShowChart] = useState(false);

  // Embedded member attendance aggregation.
  const [selectedClassDetail, setSelectedClassDetail] = useState(null);

  // — Fetch classes in real time.
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
  const openConfirm = (title, text, onOk) =>
    setConfirm({ open: true, title, text, onOk });
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

  // — Reporting:
  // Fetch attendance records using collectionGroup so that even backfilled data is included.
  // Since your attendance data stores the month as 0–11,
  // we convert the admin input (1–12) to 0–11 by subtracting 1 in the query.
  const fetchRecords = async () => {
    try {
      const col = collectionGroup(db, 'attendanceRecords');
      const qRef =
        reportMode === 'month'
          ? query(
              col,
              where('year', '==', reportYear),
              where('month', '==', reportMonth - 1) // Convert to zero-index.
            )
          : query(col, where('year', '==', reportYear));
      const snap = await getDocs(qRef);
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const downloadReport = () => {
    const csv = toCSV(records);
    // For filename, display the month as input (1–12) for user clarity.
    const fn =
      reportMode === 'month'
        ? `attendance-${reportYear}-${reportMonth}.csv`
        : `attendance-${reportYear}.csv`;
    downloadCSV(csv, fn);
  };

  // Compute chart-friendly data.
  // When displaying the period, convert the stored month (0-indexed) to human-readable (1–12).
  const chartData = useMemo(() => {
    return records
      .map((rec) => {
        const totalLessons = rec.saturdays?.length || 0;
        const totalMembers = rec.members?.length || 0;
        let overallAttendanceRate = 0;
        let averageMemberRate = 0;
        if (totalLessons > 0 && totalMembers > 0) {
          const totalAttendances = rec.members.reduce(
            (sum, m) => sum + (m.attendance?.filter(Boolean).length || 0),
            0
          );
          overallAttendanceRate = Number(
            ((totalAttendances / (totalLessons * totalMembers)) * 100).toFixed(2)
          );
          const sumMemberRates = rec.members.reduce((sum, m) => {
            const memberAttendances = m.attendance?.filter(Boolean).length || 0;
            const memberRate = (memberAttendances / totalLessons) * 100;
            return sum + memberRate;
          }, 0);
          averageMemberRate = Number((sumMemberRates / totalMembers).toFixed(2));
        }
        return {
          // Add 1 so that the period is displayed in 1–12 format.
          period: `${rec.month + 1}/${rec.year}`,
          overallAttendanceRate,
          averageMemberRate,
        };
      })
      .sort((a, b) => {
        const [mA, yA] = a.period.split('/').map(Number);
        const [mB, yB] = b.period.split('/').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
      });
  }, [records]);

  // — Embedded member aggregation in a class.
  const handleViewAggregation = (cls) => {
    setSelectedClassDetail(cls);
  };

  // For embedded aggregation, we assume total lessons from the first member’s attendance array.
  const getTotalLessons = (cls) => {
    if (cls.members && cls.members.length > 0 && cls.members[0].attendance) {
      return cls.members[0].attendance.length;
    }
    return 0;
  };

  if (loading) return <Typography>Loading…</Typography>;

  // — Filter classes by type.
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
              const { totalMembers, totalLessons, attendanceRate } = calculateSummary(c);
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
                    {/* Button for embedded aggregation */}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewAggregation(c)}
                      sx={{ ml: 1 }}
                    >
                      View Aggregation
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Embedded Member Attendance Aggregation */}
      {selectedClassDetail && (
        <Box mt={4} p={2} border="1px solid #ccc">
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              {`Member Attendance Aggregation for ${selectedClassDetail.name}`}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setSelectedClassDetail(null)}
            >
              Hide Aggregation
            </Button>
          </Grid>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Full Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Attended Sessions</strong></TableCell>
                  <TableCell><strong>Total Sessions</strong></TableCell>
                  <TableCell><strong>Attendance Rate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedClassDetail.members && selectedClassDetail.members.length > 0 ? (
                  selectedClassDetail.members.map((member, index) => {
                    const totalLessons = getTotalLessons(selectedClassDetail);
                    const attended = member.attendance ? member.attendance.filter(Boolean).length : 0;
                    const rate = totalLessons > 0 ? ((attended / totalLessons) * 100).toFixed(2) : 'N/A';
                    return (
                      <TableRow key={index}>
                        <TableCell>{member.fullName || member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{attended}</TableCell>
                        <TableCell>{totalLessons}</TableCell>
                        <TableCell>{rate}%</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No member data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Confirm Dialog for Class Deletion */}
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

      {/* Snack Notification */}
      <Snackbar
        open={snack.open}
        message={snack.msg}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      />

      {/* Add/Edit Class Modal */}
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

      {/* Add Member Modal */}
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

      {/* Reporting Section */}
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
            {/* Toggle performance chart */}
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