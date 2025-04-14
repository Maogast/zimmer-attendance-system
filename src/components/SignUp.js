// src/components/SignUp.js
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // List the email addresses that should be assigned the admin role.
  const adminEmails = [
    "stevecr58@gmail.com",
    "admin2@example.com",
    "admin3@example.com",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create user using Firebase Auth.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine role based on the email.
      // If email is in the adminEmails array (case-insensitive), assign "admin", otherwise "student"
      const userRole = adminEmails.some((adminEmail) =>
        adminEmail.toLowerCase() === email.toLowerCase()
      ) ? "admin" : "student";

      // Create a user document in Firestore with the assigned role.
      await setDoc(doc(db, "users", user.uid), {
        email,
        role: userRole,
        createdAt: serverTimestamp(),
      });

      console.log("User created and role set:", user.uid);
      // You can redirect the user or display a success message here.
    } catch (err) {
      console.error("Error signing up:", err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
          required
        />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px" }}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}