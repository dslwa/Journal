import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { type PlaybookResponse } from '../services/playbookService';

interface PlaybookListProps {
  playbooks: PlaybookResponse[];
  onEdit: (playbook: PlaybookResponse) => void;
  onDelete: (id: string) => void;
}

const PlaybookList: React.FC<PlaybookListProps> = ({
  playbooks,
  onEdit,
  onDelete,
}) => {
  return (
    <Grid container spacing={2}>
      {playbooks.map((playbook) => (
        <Grid item xs={12} sm={6} md={4} key={playbook.id}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                {playbook.title}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                {playbook.description}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton aria-label={`Edit ${playbook.title}`} onClick={() => onEdit(playbook)}>
                <Edit />
              </IconButton>
              <IconButton aria-label={`Delete ${playbook.title}`} onClick={() => onDelete(playbook.id)}>
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PlaybookList;
