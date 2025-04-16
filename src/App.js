// src/App.js
import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Import your application components
import ClassesDashboard from './components/ClassesDashboard';
import AttendanceTracker from './components/AttendanceTracker';
import AdminDashboard from './components/AdminDashboard';
import TeacherView from './components/TeacherView';

// Authentication and Protected Routes
import AuthForm from './components/AuthForm';
import Unauthorized from './components/Unauthorized';
import PrivateRoute from './components/PrivateRoute';

// Material UI components for the AppBar and dark mode toggle
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';

// Firebase signOut
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Import the Clock component
import Clock from './components/Clock';

function NavigationBar({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Title */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Church Attendance System
        </Typography>
        {/* Display Clock */}
        <Clock />
        {/* Dark mode toggle */}
        <IconButton onClick={toggleDarkMode} color="inherit" aria-label="toggle dark mode">
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        {/* Logout button */}
        <IconButton onClick={handleLogout} color="inherit" aria-label="logout" sx={{ ml: 1 }}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(
    () => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Navigation Bar */}
        <NavigationBar darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />

        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes: Accessible to both teachers and admins */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<ClassesDashboard />} />
            <Route path="/attendance-tracker/:classId" element={<AttendanceTracker />} />
            
            {/* Fixed Route - Changed from AdminAttendanceView to AttendanceTracker */}
            <Route path="/attendance/:classId" element={<AttendanceTracker />} />

            {/* Teacher-Only Routes */}
            <Route element={<PrivateRoute requiredRole="teacher" />}>
              <Route path="/teacher" element={<TeacherView />} />
            </Route>

            {/* Admin-Only Routes */}
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