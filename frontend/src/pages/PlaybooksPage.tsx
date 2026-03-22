import React, { useState } from 'react';
import { usePlaybooks } from '../context/PlaybookContext';
import PlaybookList from '../components/PlaybookList';
import PlaybookForm from '../components/PlaybookForm';
import { type PlaybookRequest, type PlaybookResponse } from '../services/playbookService';
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';

const PlaybooksPage: React.FC = () => {
  const {
    playbooks,
    loading,
    error,
    addPlaybook,
    updatePlaybook,
    deletePlaybook,
  } = usePlaybooks();
  const [open, setOpen] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] =
    useState<PlaybookResponse | null>(null);

  const handleOpen = (playbook: PlaybookResponse | null = null) => {
    setSelectedPlaybook(playbook);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPlaybook(null);
  };

  const handleSubmit = async (playbook: PlaybookRequest) => {
    try {
      if (selectedPlaybook) {
        await updatePlaybook(selectedPlaybook.id, playbook);
      } else {
        await addPlaybook(playbook);
      }
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this playbook?')) {
      try {
        await deletePlaybook(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Playbooks
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
        >
          New Playbook
        </Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <PlaybookList
          playbooks={playbooks}
          onEdit={handleOpen}
          onDelete={handleDelete}
        />
      )}

      <PlaybookForm
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        playbook={selectedPlaybook}
      />
    </Container>
  );
};

export default PlaybooksPage;
