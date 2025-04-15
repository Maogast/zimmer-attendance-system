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
} from 'firebase/firestore';
import { db } from './firebase';

// Function to add a new member to a class document.
export const addMemberToClass = async (classId, newMember) => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, { members: arrayUnion(newMember) });
    console.log('Member added successfully!');
  } catch (error) {
    console.error('Error updating members:', error);
  }
};

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

// NEW: Function to submit attendance data.
// This writes the attendance record to the attendanceRecords subcollection of the class.
export const submitAttendanceForClass = async (classId, attendanceData) => {
  try {
    // Create a record ID based on year and month (e.g., "2025-4")
    const recordId = `${attendanceData.year}-${attendanceData.month}`;
    attendanceData.timestamp = serverTimestamp();
    const attendanceDocRef = doc(db, 'classes', classId, 'attendanceRecords', recordId);
    await setDoc(attendanceDocRef, attendanceData, { merge: true });
    console.log('Attendance submitted successfully!');
  } catch (error) {
    console.error('Error submitting attendance:', error);
    throw error;
  }
};

// NEW: Function to retrieve attendance records for a class.
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