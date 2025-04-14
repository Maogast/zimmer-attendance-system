// src/App.js
import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your application components
import ClassesDashboard from './components/ClassesDashboard';
import AttendanceTracker from './components/AttendanceTracker';
import AdminDashboard from './components/AdminDashboard';
import TeacherView from './components/TeacherView';

// New components for authentication and protection
import Login from './components/Login';
import SignUp from './components/SignUp';
import Unauthorized from './components/Unauthorized';
import PrivateRoute from './components/PrivateRoute';

// Material UI components for the AppBar and dark mode toggle
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function App() {
  // State to handle dark mode toggle
  const [darkMode, setDarkMode] = useState(false);

  // Create a Material UI theme using darkMode state, recomputed on state change.
  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
      },
    }), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline resets CSS for consistent theming */}
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

        {/* Application Routes */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - requires authentication */}
          <Route element={<PrivateRoute />}>
            {/* Route accessible to any authenticated user */}
            <Route path="/" element={<ClassesDashboard />} />
            <Route path="/attendance/:classId" element={<AttendanceTracker />} />

            {/* Teacher-only route */}
            <Route element={<PrivateRoute requiredRole="teacher" />}>
              <Route path="/teacher" element={<TeacherView />} />
            </Route>

            {/* Admin-only route */}
            <Route element={<PrivateRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;