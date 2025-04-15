// src/firebaseHelpers.js
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
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

// New Feature 1: Function to delete a member from a class document.
export const deleteMemberFromClass = async (classId, member) => {
  try {
    const classRef = doc(db, 'classes', classId);
    // arrayRemove will remove the given member from the members array.
    await updateDoc(classRef, { members: arrayRemove(member) });
    console.log('Member deleted successfully!');
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// New Feature 2: Function to delete an entire class document.
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
    console.log('Class deleted successfully!');
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};