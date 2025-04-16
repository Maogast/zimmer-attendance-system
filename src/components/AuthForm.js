// src/components/AuthForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const AuthForm = () => {
  // Toggle between login and sign‐up modes.
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Additional state for password reset messages.
  const [resetMessage, setResetMessage] = useState('');

  // List of admin emails; if a new user’s email matches one of these, they get the "admin" role.
  const adminEmails = [
    "stevecr58@gmail.com",
    "admin2@example.com",
    "admin3@example.com"
  ];

  const navigate = useNavigate();

  // Listen for auth state changes and redirect based on role.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Retrieve the user role from Firestore.
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        // If no document exists assume default role is "teacher"
        const userRole = userSnap.exists() ? userSnap.data().role : "teacher";
        // Redirect based on role.
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "teacher") {
          navigate("/teacher");
        } else {
          navigate("/");
        }
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Email and Password-based login/sign-up function.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    if (isLogin) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle redirect based on role.
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Send email verification.
        await sendEmailVerification(user);
        alert("Verification email sent. Please verify your email before logging in.");

        // Determine the role: if the email is in adminEmails, assign "admin"; otherwise assign "teacher".
        const userRole = adminEmails.some(
          (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
        ) ? "admin" : "teacher";

        // Create a Firestore user document.
        await setDoc(doc(db, 'users', user.uid), {
          email,
          role: userRole,
          createdAt: serverTimestamp(),
        });
        // onAuthStateChanged will then handle redirection.
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Google Sign-In flow.
  const handleGoogleSignIn = async () => {
    setError('');
    setResetMessage('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      // Check if the user already has a Firestore document.
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        // New Google user: determine role based on the admin email list.
        const userRole = adminEmails.some(
          (adminEmail) => adminEmail.toLowerCase() === user.email.toLowerCase()
        ) ? "admin" : "teacher";
        await setDoc(userDocRef, {
          email: user.email,
          role: userRole,
          createdAt: serverTimestamp(),
        });
      }
      // onAuthStateChanged handles redirection.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password handler.
  const handleForgotPassword = async () => {
    setError('');
    setResetMessage('');
    if (!email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Password reset email sent. Please check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {resetMessage && <p style={{ color: 'green' }}>{resetMessage}</p>}
      
      {/* Email/Password Form */}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          required
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
        </button>
      </form>
      
      {/* Forgot Password Link for Login Mode */}
      {isLogin && (
        <p style={{ marginTop: '10px' }}>
          <button 
            onClick={handleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: 'blue',
              cursor: 'pointer',
              padding: 0
            }}
          >
            Forgot Password?
          </button>
        </p>
      )}
      
      {/* Toggle between Login and Sign-up */}
      <p style={{ marginTop: '10px' }}>
        {isLogin ? "New user? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: 'none',
            border: 'none',
            color: 'blue',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {isLogin ? "Switch to Sign Up" : "Switch to Login"}
        </button>
      </p>
      
      {/* Google Sign-In Button */}
      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '10px',
          backgroundColor: '#4285F4',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {loading ? "Processing..." : "Sign In with Google"}
      </button>
    </div>
  );
};

export default AuthForm;