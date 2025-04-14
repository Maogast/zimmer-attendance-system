// src/components/AuthForm.js
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthForm = () => {
  // Toggle between login and signup mode
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // List of admin emails to automatically assign the "admin" role
  const adminEmails = [
    "stevecr58@gmail.com",
    "admin2@example.com",
    "admin3@example.com"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      // Login flow
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Login successful; you may redirect the user or show a success message.
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Sign-up flow
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Determine the role based on the admin email list (case-insensitive).
        const userRole = adminEmails.some(
          (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
        ) ? "admin" : "student";
        // Create a user document in Firestore with the assigned role.
        await setDoc(doc(db, 'users', user.uid), {
          email,
          role: userRole,
          createdAt: serverTimestamp(),
        });
        // Sign-up successful; you may redirect the user or display a welcome message.
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
        <button 
          type="submit" 
          disabled={loading} 
          style={{ width: '100%', padding: '10px' }}
        >
          {loading ? "Processing..." : (isLogin ? "Login" : "Sign Up")}
        </button>
      </form>
      <p style={{ marginTop: '10px' }}>
        {isLogin
          ? "New user? "
          : "Already have an account? "}
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
    </div>
  );
};

export default AuthForm;