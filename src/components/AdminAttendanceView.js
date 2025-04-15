// src/components/AdminAttendanceView.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, collection, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const AdminAttendanceView = () => {
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // Get the class document.
        const classDocRef = doc(db, 'classes', classId);
        const classDocSnap = await getDoc(classDocRef);
        if (classDocSnap.exists()) {
          setClassInfo({ id: classDocSnap.id, ...classDocSnap.data() });
        } else {
          console.error('Class not found.');
        }

        // Get the attendance records subcollection.
        const attendanceCollectionRef = collection(db, 'classes', classId, 'attendanceRecords');
        const attendanceSnapshot = await getDocs(attendanceCollectionRef);
        const records = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [classId]);

  if (loading) {
    return <Typography variant="h6">Loading attendance records...</Typography>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Attendance for {classInfo ? classInfo.name : 'Class'}
      </Typography>
      {attendanceRecords.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Present Members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.id}>
                  {/* Format the timestamp to a local date. Adjust the conversion if using a Timestamp object */}
                  <TableCell>
                    {record.date && record.date.seconds
                      ? new Date(record.date.seconds * 1000).toLocaleDateString()
                      : record.id}
                  </TableCell>
                  <TableCell>
                    {record.presentMembers && record.presentMembers.join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No attendance records found for this class.</Typography>
      )}
    </div>
  );
};

export default AdminAttendanceView;