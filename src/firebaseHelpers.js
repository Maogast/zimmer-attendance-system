// src/firebaseHelpers.js
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const updateClassMembers = async (classId, updatedMembers) => {
  try {
    const classRef = doc(db, 'classes', classId);
    await updateDoc(classRef, { members: updatedMembers });
  } catch (error) {
    console.error('Error updating members:', error);
  }
};