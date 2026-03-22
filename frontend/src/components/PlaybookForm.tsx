import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { type PlaybookRequest, type PlaybookResponse } from '../services/playbookService';

interface PlaybookFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (playbook: PlaybookRequest) => void;
  playbook: PlaybookResponse | null;
}

const PlaybookForm: React.FC<PlaybookFormProps> = ({
  open,
  onClose,
  onSubmit,
  playbook,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [setup, setSetup] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [riskNote, setRiskNote] = useState('');

  useEffect(() => {
    if (playbook) {
      setTitle(playbook.title);
      setDescription(playbook.description);
      setRules(playbook.rules);
      setSetup(playbook.setup);
      setTimeframe(playbook.timeframe);
      setRiskNote(playbook.riskNote);
    } else {
      setTitle('');
      setDescription('');
      setRules('');
      setSetup('');
      setTimeframe('');
      setRiskNote('');
    }
  }, [playbook]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, rules, setup, timeframe, riskNote });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{playbook ? 'Edit Playbook' : 'New Playbook'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Rules"
            fullWidth
            multiline
            rows={4}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Setup"
            fullWidth
            multiline
            rows={4}
            value={setup}
            onChange={(e) => setSetup(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Timeframe"
            fullWidth
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Risk Note"
            fullWidth
            multiline
            rows={2}
            value={riskNote}
            onChange={(e) => setRiskNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {playbook ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PlaybookForm;
