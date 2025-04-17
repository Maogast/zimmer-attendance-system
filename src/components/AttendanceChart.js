// src/components/AttendanceChart.js
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const AttendanceChart = ({ data }) => {
  // Process the incoming data to derive highAttendancePercentage for each period.
  const processedData = data.map((item) => ({
    ...item,
    highAttendancePercentage: item.totalMembers
      ? Number(((item.highAttendanceCount / item.totalMembers) * 100).toFixed(2))
      : 0,
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="overallAttendanceRate" 
            fill="#82ca9d" 
            name="Overall Attendance (%)" 
          />
          <Bar 
            dataKey="averageMemberRate" 
            fill="#8884d8" 
            name="Average Member Attendance (%)"
          />
          <Bar 
            dataKey="highAttendancePercentage" 
            fill="#FF8042" 
            name="High Attendance (%)" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;