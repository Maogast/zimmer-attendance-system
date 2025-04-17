// src/components/AttendanceReports.js
import React, { useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem } from '@mui/material';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Helper: Convert an array of objects (JSON) into a CSV string.
const convertJSONToCSV = (jsonData) => {
  if (!jsonData || jsonData.length === 0) return '';
  
  // Extract headers from the keys of the first object.
  const headers = Object.keys(jsonData[0]);
  const csvRows = [
    headers.join(','),  // CSV header row.
    ...jsonData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ];
  return csvRows.join('\n');
};

// Helper: Trigger CSV download.
const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
};

const AttendanceReports = () => {
  // Reporting mode: "month" or "year"
  const [reportMode, setReportMode] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear());
  // Use 1-12 for ease of use.
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Fetch attendance records using collectionGroup so it fetches across all classes.
  const fetchAttendanceRecords = async () => {
    try {
      let q;
      if (reportMode === 'month') {
        // Query for a specific month and year.
        q = query(
          collectionGroup(db, 'attendanceRecords'),
          where('year', '==', year),
          where('month', '==', month)
        );
      } else if (reportMode === 'year') {
        // Query for the specified year.
        q = query(
          collectionGroup(db, 'attendanceRecords'),
          where('year', '==', year)
        );
      }
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  // Generate and download CSV.
  const handleDownloadCSV = () => {
    const csvContent = convertJSONToCSV(attendanceRecords);
    const fileName = reportMode === 'month'
      ? `attendance-${year}-${month}.csv`
      : `attendance-${year}.csv`;
    downloadCSV(csvContent, fileName);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Reports
      </Typography>
      <Box sx={{ my: 2 }}>
        <TextField
          select
          label="Report Mode"
          value={reportMode}
          onChange={e => setReportMode(e.target.value)}
          sx={{ mr: 2, width: '150px' }}
        >
          <MenuItem value="month">Monthly</MenuItem>
          <MenuItem value="year">Yearly</MenuItem>
        </TextField>
        <TextField
          label="Year"
          type="number"
          value={year}
          onChange={e => setYear(parseInt(e.target.value, 10))}
          sx={{ mr: 2, width: '120px' }}
        />
        {reportMode === 'month' && (
          <TextField
            label="Month"
            type="number"
            value={month}
            onChange={e => setMonth(parseInt(e.target.value, 10))}
            sx={{ mr: 2, width: '120px' }}
            inputProps={{ min: 1, max: 12 }}
          />
        )}
        <Button variant="contained" onClick={fetchAttendanceRecords}>
          Fetch Report
        </Button>
      </Box>
      {attendanceRecords.length > 0 && (
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">
            {`Found ${attendanceRecords.length} record(s) for the selected ${reportMode === 'month' ? 'month' : 'year'}.`}
          </Typography>
          <Button variant="outlined" onClick={handleDownloadCSV} sx={{ mt: 2 }}>
            Download CSV
          </Button>
          <Box sx={{ mt: 3 }}>
            {attendanceRecords.map(record => (
              <Box key={record.id} sx={{ p: 1, borderBottom: '1px solid #ccc' }}>
                <Typography variant="body2">
                  {`Record ID: ${record.id} | Year: ${record.year}, Month: ${record.month}, Submitted At: ${record.submittedAt || 'N/A'}`}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AttendanceReports;