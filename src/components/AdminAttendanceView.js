// src/components/AdminAttendanceView.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
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

  // Fetch class details once from Firestore.
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

  // Fetch attendance records from Firestore.
  useEffect(() => {
    // Option 1: One-time fetch using your helper function.
    const fetchRecords = async () => {
      try {
        const records = await getAttendanceRecordsForClass(classId);
        setAttendanceRecords(records);
      } catch (error) {
        console.error("Error fetching attendance records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();

    // Option 2: Use a real-time listener with onSnapshot.
    // Uncomment the code below to enable real-time updates.
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
  // Analytics Computations
  // -----------------------------
  
  // Overall attendance analytics.
  let overallTotalPossible = 0;
  let overallTotalAttended = 0;
  attendanceRecords.forEach(record => {
    const sessions = record.saturdays ? record.saturdays.length : 0;
    const membersCount = record.members ? record.members.length : 0;
    overallTotalPossible += sessions * membersCount;
    record.members?.forEach(member => {
      if (member.attendance) {
        overallTotalAttended += member.attendance.filter(Boolean).length;
      }
    });
  });
  const overallRate =
    overallTotalPossible > 0
      ? ((overallTotalAttended / overallTotalPossible) * 100).toFixed(2)
      : "N/A";

  // Analytics per attendance record.
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
      timestamp: record.timestamp && record.timestamp.toDate
        ? format(record.timestamp.toDate(), "PPP p")
        : "N/A",
    };
  });

  // Prepare data for the chart.
  const chartData = recordAnalytics.map(rec => ({
    month: rec.id, // expects record IDs like "2025-4"
    attendanceRate: parseFloat(rec.rate) || 0,
  }));

  // Compute per-member analytics across all records.
  const memberStats = {};
  attendanceRecords.forEach(record => {
    record.members?.forEach(member => {
      // Use email as unique identifier; if missing, fallback to name.
      const key = member.email ? member.email.toLowerCase() : member.fullName;
      if (!memberStats[key]) {
        memberStats[key] = { fullName: member.fullName, totalSessions: 0, attended: 0 };
      }
      const sessions = member.attendance ? member.attendance.length : 0;
      const attendedCount = member.attendance ? member.attendance.filter(Boolean).length : 0;
      memberStats[key].totalSessions += sessions;
      memberStats[key].attended += attendedCount;
    });
  });
  const memberStatsArray = Object.values(memberStats).map(stats => ({
    fullName: stats.fullName,
    totalSessions: stats.totalSessions,
    attended: stats.attended,
    rate: stats.totalSessions > 0 ? ((stats.attended / stats.totalSessions) * 100).toFixed(2) : "N/A",
  }));

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
        Overall Class Attendance Rate: {overallRate}%
      </Typography>

      {/* Graphical Dashboard */}
      <Typography variant="h5" sx={{ mt: 3 }}>Monthly Attendance Trend</Typography>
      <AttendanceChart data={chartData} />

      {/* Attendance Records Summary */}
      <Typography variant="h5" sx={{ mt: 3 }}>Attendance Records</Typography>
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
      <Typography variant="h5" sx={{ mt: 3 }}>Per-Member Attendance Analytics</Typography>
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