// src/firebaseHelpers.js
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

// Adds a new member to a class document's "members" array.
export const addMemberToClass = async (classId, newMember) => {
  try {
    const classRef = doc(db, 'classes', classId);
    // Use arrayUnion to add newMember to the members array.
    await updateDoc(classRef, { members: arrayUnion(newMember) });
    console.log('Member added successfully!');
  } catch (error) {
    console.error('Error adding member:', error);
  }
};