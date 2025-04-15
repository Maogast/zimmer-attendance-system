// src/firebaseHelpers.js
import { doc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

// Function to add a new member to a class document.
export const addMemberToClass = async (classId, newMember) => {
  try {
    const classRef = doc(db, 'classes', classId);
    // arrayUnion will append newMember to the members array without duplicating existing data
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