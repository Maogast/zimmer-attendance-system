// src/components/AdminAttendanceView.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAttendanceRecordsForClass } from '../firebaseHelpers';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import AttendanceChart from './AttendanceChart';

const AdminAttendanceView = () => {
  const { classId } = useParams();

  // Persistent class info.
  const [classInfo, setClassInfo] = useState({ name: '', teacher: '', elder: '' });
  // Attendance records.
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aggregated data: overall aggregated per-member attendance.
  const [aggregatedMembers, setAggregatedMembers] = useState(null);

  // -----------------------------
  // 1. Fetch Class Details
  // -----------------------------
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassInfo({
            name: data.name || '',
            teacher: data.teacher || '',
            elder: data.elder || '',
          });
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
    };

    fetchClassData();
  }, [classId]);

  // -----------------------------
  // 2. Fetch Attendance Records
  // -----------------------------
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // Option 1: One-time fetch using your helper function.
        const records = await getAttendanceRecordsForClass(classId);
        setAttendanceRecords(records);
      } catch (error) {
        console.error("Error fetching attendance records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();

    // Option 2 (realtime listener) can be enabled by uncommenting below.
    /*
    const recordsRef = collection(db, 'classes', classId, 'attendanceRecords');
    const unsubscribe = onSnapshot(recordsRef, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceRecords(records);
      setLoading(false);
    }, (error) => {
      console.error("Error with real-time listener:", error);
      setLoading(false);
    });
    return () => unsubscribe();
    */
  }, [classId]);

  // -----------------------------
  // 3. Aggregate Teacher Submissions for Overall Analytics
  // -----------------------------
  useEffect(() => {
    // Merge teacher submissions across all attendance records.
    const aggregated = {};
    attendanceRecords.forEach(record => {
      record.members?.forEach(member => {
        // Use email as unique key; fallback to fullName.
        const key = member.email ? member.email.toLowerCase() : member.fullName;
        if (!aggregated[key]) {
          aggregated[key] = {
            fullName: member.fullName || member.name || 'Unknown',
            totalSessions: 0,
            attended: 0,
          };
        }
        const sessions = member.attendance ? member.attendance.length : 0;
        const attendedCount = member.attendance ? member.attendance.filter(Boolean).length : 0;
        aggregated[key].totalSessions += sessions;
        aggregated[key].attended += attendedCount;
      });
    });
    setAggregatedMembers(aggregated);
  }, [attendanceRecords]);

  // Compute overall aggregated analytics.
  let overallTotalPossible = 0;
  let overallTotalAttended = 0;
  if (aggregatedMembers) {
    Object.values(aggregatedMembers).forEach(mem => {
      overallTotalPossible += mem.totalSessions;
      overallTotalAttended += mem.attended;
    });
  }
  const overallRate =
    overallTotalPossible > 0
      ? ((overallTotalAttended / overallTotalPossible) * 100).toFixed(2)
      : "N/A";

  // -----------------------------
  // 4. Per-Attendance Record Analytics (each teacher submission)
  // -----------------------------
  const recordAnalytics = attendanceRecords.map(record => {
    const sessions = record.saturdays ? record.saturdays.length : 0;
    const countMembers = record.members ? record.members.length : 0;
    const totalPossible = sessions * countMembers;
    let totalAttended = 0;
    record.members?.forEach(member => {
      totalAttended += member.attendance ? member.attendance.filter(Boolean).length : 0;
    });
    const rate = totalPossible > 0 ? ((totalAttended / totalPossible) * 100).toFixed(2) : "N/A";
    return {
      id: record.id,
      sessions,
      membersCount: countMembers,
      rate,
      timestamp:
        record.timestamp && record.timestamp.toDate
          ? format(record.timestamp.toDate(), "PPP p")
          : "N/A",
    };
  });

  // -----------------------------
  // 5. Prepare Data for the Chart
  // -----------------------------
  // For this chart, we assume each attendance record has a stored month (zero-indexed).
  // We'll display the period as Month/Year (with month converted to 1-indexed). 
  const chartData = recordAnalytics.map(rec => {
    // We'll attempt to extract the month from one of the record fields.
    // For simplicity, we assume record.id is in the format "year-month"
    // e.g., "2025-0" -> January 2025.
    const parts = rec.id.split("-");
    const recordYear = parts[0];
    const recordMonth = parts[1] ? Number(parts[1]) + 1 : "N/A";
    return {
      period: `${recordMonth}/${recordYear}`,
      attendanceRate: parseFloat(rec.rate) || 0,
    };
  });

  // -----------------------------
  // 6. Compute Per-Member Aggregated Analytics
  // -----------------------------
  const memberStatsArray = aggregatedMembers
    ? Object.values(aggregatedMembers).map(stats => ({
        fullName: stats.fullName,
        totalSessions: stats.totalSessions,
        attended: stats.attended,
        rate:
          stats.totalSessions > 0
            ? ((stats.attended / stats.totalSessions) * 100).toFixed(2)
            : "N/A",
      }))
    : [];

  if (loading) {
    return <Typography>Loading attendance records...</Typography>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Class Information */}
      <Typography variant="h4" gutterBottom>
        Attendance Analytics for {classInfo.name}
      </Typography>
      <Typography variant="subtitle1">
        Teacher: {classInfo.teacher} | Elder: {classInfo.elder}
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>
        Overall Aggregated Attendance Rate: {overallRate}%
      </Typography>

      {/* Graphical Dashboard */}
      <Typography variant="h5" sx={{ mt: 3 }}>
        Monthly Attendance Trend
      </Typography>
      <AttendanceChart data={chartData} />

      {/* Attendance Records Summary */}
      <Typography variant="h5" sx={{ mt: 3 }}>
        Attendance Records
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 1, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Record ID (Year-Month)</TableCell>
              <TableCell>Session Count</TableCell>
              <TableCell>Total Members</TableCell>
              <TableCell>Attendance Rate (%)</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recordAnalytics.map(record => (
              <TableRow key={record.id}>
                <TableCell>{record.id}</TableCell>
                <TableCell>{record.sessions}</TableCell>
                <TableCell>{record.membersCount}</TableCell>
                <TableCell>{record.rate}</TableCell>
                <TableCell>{record.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Per-Member Attendance Analytics */}
      <Typography variant="h5" sx={{ mt: 3 }}>
        Per-Member Attendance Analytics
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member Name</TableCell>
              <TableCell>Total Sessions</TableCell>
              <TableCell>Sessions Attended</TableCell>
              <TableCell>Attendance Rate (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memberStatsArray.map((member, idx) => (
              <TableRow key={idx}>
                <TableCell>{member.fullName}</TableCell>
                <TableCell>{member.totalSessions}</TableCell>
                <TableCell>{member.attended}</TableCell>
                <TableCell>{member.rate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminAttendanceView;