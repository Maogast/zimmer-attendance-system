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

// New unified authentication component and related routes
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

/* NavigationBar Component:
   This component renders the top AppBar including:
   - Title
   - Current date and time (using Clock component)
   - Dark mode toggle button
   - Logout button which signs out the user and redirects to '/auth'
*/
function NavigationBar({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to the authentication page after logging out
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
        {/* Display Clock (date & time) */}
        <Clock />
        {/* Dark mode toggle */}
        <IconButton
          onClick={toggleDarkMode}
          color="inherit"
          aria-label="toggle dark mode"
        >
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        {/* Logout button */}
        <IconButton
          onClick={handleLogout}
          color="inherit"
          aria-label="logout"
          sx={{ ml: 1 }}
        >
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  // State to handle dark mode toggle
  const [darkMode, setDarkMode] = useState(false);

  // Create a Material UI theme using darkMode state
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* Use our custom NavigationBar */}
        <NavigationBar
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Application Routes */}
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - requires authentication */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<ClassesDashboard />} />
            <Route path="/attendance/:classId" element={<AttendanceTracker />} />
            <Route element={<PrivateRoute requiredRole="teacher" />}>
              <Route path="/teacher" element={<TeacherView />} />
            </Route>
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