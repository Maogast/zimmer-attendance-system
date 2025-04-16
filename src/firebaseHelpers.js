// src/firebaseHelpers.js
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  deleteDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// -----------------------------
// CLASS MANAGEMENT FUNCTIONS
// -----------------------------

// Function to add a new class document to the "classes" collection.
export const addNewClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, 'classes'), classData);
    console.log('Class created with ID:', docRef.id);
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

// Function to update an existing class document.
export const updateClass = async (classId, updatedClassData) => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, updatedClassData);
    console.log('Class updated successfully!');
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// Function to delete an entire class document.
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
    console.log('Class deleted successfully!');
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

// -----------------------------
// MEMBER MANAGEMENT FUNCTIONS
// -----------------------------

// Function to add a new member to a class document.
export const addMemberToClass = async (classId, newMember) => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, { members: arrayUnion(newMember) });
    console.log('Member added successfully!');
  } catch (error) {
    console.error('Error updating members:', error);
    throw error;
  }
};

// Function to delete a member from a class document.
export const deleteMemberFromClass = async (classId, member) => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, { members: arrayRemove(member) });
    console.log('Member deleted successfully!');
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// -----------------------------
// ATTENDANCE FUNCTIONS
// -----------------------------

// Function to submit attendance data.
// Writes the attendance record to the attendanceRecords subcollection.
export const submitAttendanceForClass = async (classId, attendanceData) => {
  try {
    const recordId = `${attendanceData.year}-${attendanceData.month}`; // e.g., "2025-4"
    attendanceData.timestamp = serverTimestamp();
    const attendanceDocRef = doc(db, 'classes', classId, 'attendanceRecords', recordId);
    await setDoc(attendanceDocRef, attendanceData, { merge: true });
    console.log('Attendance submitted successfully!');
  } catch (error) {
    console.error('Error submitting attendance:', error);
    throw error;
  }
};

// Function to retrieve attendance records for a class.
export const getAttendanceRecordsForClass = async (classId) => {
  try {
    const attendanceRecordsCollectionRef = collection(db, 'classes', classId, 'attendanceRecords');
    const recordsSnapshot = await getDocs(attendanceRecordsCollectionRef);
    const records = recordsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return records;
  } catch (error) {
    console.error('Error getting attendance records:', error);
    throw error;
  }
};

// -----------------------------
// ENHANCED ATTENDANCE FUNCTIONS
// -----------------------------

// 1. Update Attendance Record: Allows updating a previously submitted attendance record.
export const updateAttendanceRecordForClass = async (classId, recordId, updatedData) => {
  try {
    const attendanceDocRef = doc(db, 'classes', classId, 'attendanceRecords', recordId);
    await updateDoc(attendanceDocRef, updatedData);
    console.log('Attendance record updated successfully!');
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

// 2. Delete Attendance Record: Allows deleting a specific attendance record.
export const deleteAttendanceRecordForClass = async (classId, recordId) => {
  try {
    const attendanceDocRef = doc(db, 'classes', classId, 'attendanceRecords', recordId);
    await deleteDoc(attendanceDocRef);
    console.log('Attendance record deleted successfully!');
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
};

// 3. Get Attendance Records by Date Range: Retrieves attendance records within a specific date range.
// Note: startDate and endDate should be Date objects.
export const getAttendanceRecordsForClassByDate = async (classId, startDate, endDate) => {
  try {
    const attendanceRecordsCollectionRef = collection(db, 'classes', classId, 'attendanceRecords');
    const q = query(
      attendanceRecordsCollectionRef,
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );
    const recordsSnapshot = await getDocs(q);
    const records = recordsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return records;
  } catch (error) {
    console.error('Error getting filtered attendance records:', error);
    throw error;
  }
};

// 4. Calculate Member Analytics: Aggregates attendance records to compute total sessions, attendance count, and rate for a given member.
// memberIdentifier should uniquely identify a member (for example, their email).
export const calculateMemberAnalytics = (attendanceRecords, memberIdentifier) => {
  let totalSessions = 0;
  let attendedSessions = 0;
  
  attendanceRecords.forEach(record => {
    record.members?.forEach(member => {
      if (member.email && member.email.toLowerCase() === memberIdentifier.toLowerCase()) {
        const sessions = member.attendance ? member.attendance.length : 0;
        const attended = member.attendance ? member.attendance.filter(Boolean).length : 0;
        totalSessions += sessions;
        attendedSessions += attended;
      }
    });
  });
  
  return {
    totalSessions,
    attendedSessions,
    rate: totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : "N/A"
  };
};

// -----------------------------
// TEACHER LOGGING FUNCTION
// -----------------------------

/**
 * Logs a teacher action in Firestore.
 * @param {string} teacherId - UID of the teacher.
 * @param {string} teacherEmail - Email of the teacher.
 * @param {string} action - Description of the action (e.g., "SUBMIT_ATTENDANCE", "ADD_MEMBER", "TOGGLE_ATTENDANCE").
 * @param {Object} details - Optional additional details about the action.
 */
export const logTeacherAction = async (teacherId, teacherEmail, action, details = {}) => {
  try {
    await addDoc(collection(db, "logs"), {
      teacherId,
      teacherEmail,
      action,
      details,
      timestamp: serverTimestamp(),
    });
    console.log("Logged teacher action:", action);
  } catch (error) {
    console.error("Error logging teacher action:", error);
  }
};