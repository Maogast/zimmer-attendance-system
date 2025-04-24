// src/components/MemberDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Box,
  Typography,
  Paper,
  Button,
  Modal,
  TextField,
  Snackbar
} from '@mui/material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const MemberDetail = () => {
  const { classId, memberIndex } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null); // Full class document
  const [member, setMember] = useState(null);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '' });

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassData(data);
          setClassName(data.name || 'Unnamed Class');
          const idx = parseInt(memberIndex, 10);
          if (data.members && data.members.length > idx) {
            setMember(data.members[idx]);
            // Prepopulate edit form with current member details.
            setEditForm({
              fullName: data.members[idx].fullName || data.members[idx].name || '',
              residence: data.members[idx].residence || '',
              prayerCell: data.members[idx].prayerCell || '',
              phone: data.members[idx].phone || '',
              email: data.members[idx].email || '',
              membership: data.members[idx].membership || '',
              baptized: data.members[idx].baptized || ''
            });
          }
        } else {
          console.error('Class not found for id:', classId);
        }
      } catch (error) {
        console.error('Error fetching member details:', error);
      }
      setLoading(false);
    };

    fetchMember();
  }, [classId, memberIndex]);

  const handleEditSave = async () => {
    // Update the member at the corresponding index in the classData.members array.
    const idx = parseInt(memberIndex, 10);
    if (!classData || !classData.members || idx >= classData.members.length) return;
    const updatedMembers = [...classData.members];
    updatedMembers[idx] = {
      ...updatedMembers[idx],
      fullName: editForm.fullName,
      residence: editForm.residence,
      prayerCell: editForm.prayerCell,
      phone: editForm.phone,
      email: editForm.email,
      membership: editForm.membership,
      baptized: editForm.baptized,
    };

    try {
      await updateDoc(doc(db, 'classes', classId), { members: updatedMembers });
      setMember(updatedMembers[idx]);
      // Also update local classData
      setClassData({ ...classData, members: updatedMembers });
      setSnack({ open: true, msg: 'Member details updated successfully.' });
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating member:', error);
      setSnack({ open: true, msg: 'Error updating member details.' });
    }
  };

  if (loading) {
    return <Typography>Loading member details...</Typography>;
  }

  if (!member) {
    return <Typography>Member not found.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="outlined" onClick={() => navigate(-1)}>
        Back
      </Button>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          {member.fullName || member.name}'s Details (Class: {className})
        </Typography>
        <Typography variant="body1">
          <strong>Email:</strong> {member.email}
        </Typography>
        <Typography variant="body1">
          <strong>Phone:</strong> {member.phone}
        </Typography>
        <Typography variant="body1">
          <strong>Prayer Cell:</strong> {member.prayerCell}
        </Typography>
        <Typography variant="body1">
          <strong>Residence:</strong> {member.residence}
        </Typography>
        <Typography variant="body1">
          <strong>Membership:</strong> {member.membership}
        </Typography>
        <Typography variant="body1">
          <strong>Baptized:</strong> {member.baptized}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => setEditOpen(true)}>
            Edit Details
          </Button>
        </Box>
      </Paper>

      {/* Edit Member Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>
            Edit Member Details
          </Typography>
          <TextField
            fullWidth
            label="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Prayer Cell"
            value={editForm.prayerCell}
            onChange={(e) => setEditForm({ ...editForm, prayerCell: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Residence"
            value={editForm.residence}
            onChange={(e) => setEditForm({ ...editForm, residence: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Membership"
            value={editForm.membership}
            onChange={(e) => setEditForm({ ...editForm, membership: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Baptized"
            value={editForm.baptized}
            onChange={(e) => setEditForm({ ...editForm, baptized: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" fullWidth onClick={handleEditSave}>
            Save Changes
          </Button>
        </Box>
      </Modal>

      <Snackbar
        open={snack.open}
        message={snack.msg}
        autoHideDuration={3000}
        onClose={() => setSnack({ open: false, msg: '' })}
      />
    </Box>
  );
};

export default MemberDetail;