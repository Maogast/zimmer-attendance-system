// src/App.js
import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClassesDashboard from './components/ClassesDashboard';
import AttendanceTracker from './components/AttendanceTracker';
import AdminDashboard from './components/AdminDashboard';

// Material UI components for the AppBar and toggle button
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function App() {
  // State to hold the dark mode toggle
  const [darkMode, setDarkMode] = useState(false);

  // Using useMemo hook to create a theme based on the darkMode state
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  }), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline helps reset styles for consistent theming */}
      <CssBaseline />
      <BrowserRouter>
        {/* Top Navigation Bar with dark mode toggle */}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Church Attendance System
            </Typography>
            <IconButton
              onClick={() => setDarkMode(!darkMode)}
              color="inherit"
              aria-label="toggle dark mode"
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Routes for the different components/pages */}
        <Routes>
          <Route path="/" element={<ClassesDashboard />} />
          <Route path="/attendance/:classId" element={<AttendanceTracker />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;