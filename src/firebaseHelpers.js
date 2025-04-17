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
} from 'firebase/firestore';
import { db } from './firebase';

// -----------------------------
// CLASS MANAGEMENT FUNCTIONS
// -----------------------------

export const addNewClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, 'classes'), classData);
    console.log('Class created with ID:', docRef.id);
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

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

export const submitAttendanceForClass = async (classId, attendanceData) => {
  try {
    const recordId = `${attendanceData.year}-${attendanceData.month}`; // e.g., "2025-4"
    attendanceData.timestamp = serverTimestamp();
    const attendanceDocRef = doc(
      db,
      'classes',
      classId,
      'attendanceRecords',
      recordId
    );
    await setDoc(attendanceDocRef, attendanceData, { merge: true });
    console.log('Attendance submitted successfully!');
  } catch (error) {
    console.error('Error submitting attendance:', error);
    throw error;
  }
};

export const getAttendanceRecordsForClass = async (classId) => {
  try {
    const attendanceRecordsCollectionRef = collection(
      db,
      'classes',
      classId,
      'attendanceRecords'
    );
    const recordsSnapshot = await getDocs(attendanceRecordsCollectionRef);
    const records = recordsSnapshot.docs.map((doc) => ({
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

export const updateAttendanceRecordForClass = async (
  classId,
  recordId,
  updatedData
) => {
  try {
    const attendanceDocRef = doc(
      db,
      'classes',
      classId,
      'attendanceRecords',
      recordId
    );
    await updateDoc(attendanceDocRef, updatedData);
    console.log('Attendance record updated successfully!');
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

export const deleteAttendanceRecordForClass = async (classId, recordId) => {
  try {
    const attendanceDocRef = doc(
      db,
      'classes',
      classId,
      'attendanceRecords',
      recordId
    );
    await deleteDoc(attendanceDocRef);
    console.log('Attendance record deleted successfully!');
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
};

export const getAttendanceRecordsForClassByDate = async (
  classId,
  startDate,
  endDate
) => {
  try {
    const attendanceRecordsCollectionRef = collection(
      db,
      'classes',
      classId,
      'attendanceRecords'
    );
    const q = query(
      attendanceRecordsCollectionRef,
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );
    const recordsSnapshot = await getDocs(q);
    const records = recordsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return records;
  } catch (error) {
    console.error('Error getting filtered attendance records:', error);
    throw error;
  }
};

export const calculateMemberAnalytics = (attendanceRecords, memberIdentifier) => {
  let totalSessions = 0;
  let attendedSessions = 0;

  attendanceRecords.forEach((record) => {
    record.members?.forEach((member) => {
      if (
        member.email &&
        member.email.toLowerCase() === memberIdentifier.toLowerCase()
      ) {
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
    rate:
      totalSessions > 0
        ? ((attendedSessions / totalSessions) * 100).toFixed(2)
        : "N/A",
  };
};

// -----------------------------
// TEACHER LOGGING FUNCTION
// -----------------------------

export const logTeacherAction = async (
  teacherId,
  teacherEmail,
  action,
  details = {}
) => {
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

// -----------------------------
// CSV HELPER FUNCTIONS
// -----------------------------
//
// Converts an array of objects into a CSV string, with a special handling
// for the "members" field: it extracts each member's fullName (or name) and
// joins them with "; ".
//
// Usage: Pass an array of data objects and then download with downloadCSV.
//

export const toCSV = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map((row) =>
      headers
        .map((h) => {
          let cell = row[h] || '';
          if (h === 'members' && Array.isArray(cell)) {
            // Extract the full names (or fallback to name) from each member
            cell = cell
              .map((member) => member.fullName || member.name || '')
              .filter((name) => name !== '')
              .join('; ');
          }
          return `"${cell}"`;
        })
        .join(',')
    ),
  ];
  return csvRows.join('\n');
};

export const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
};