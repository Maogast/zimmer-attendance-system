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
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="overallAttendanceRate" fill="#82ca9d" name="Overall Attendance" />
          <Bar dataKey="averageMemberRate" fill="#8884d8" name="Average Member Attendance" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;