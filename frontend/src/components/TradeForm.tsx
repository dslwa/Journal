import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { type TradeRequest, type TradeDirection, type TradeResponse } from '../services/tradeService';
import { usePlaybooks } from '../context/PlaybookContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface TradeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (trade: TradeRequest) => void;
  trade: TradeResponse | null;
}

const TradeForm: React.FC<TradeFormProps> = ({
  open,
  onClose,
  onSubmit,
  trade,
}) => {
  const [ticker, setTicker] = useState('');
  const [direction, setDirection] = useState<TradeDirection>(
    'LONG'
  );
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [exitPrice, setExitPrice] = useState<number | ''>('');
  const [positionSize, setPositionSize] = useState<number | ''>('');
  const [openedAt, setOpenedAt] = useState<Date | null>(new Date());
  const [closedAt, setClosedAt] = useState<Date | null>(null);
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [playbookId, setPlaybookId] = useState<string | ''>('');
  const [notes, setNotes] = useState('');
  const { playbooks } = usePlaybooks(); // Użyj kontekstu, aby pobrać playbooki

  useEffect(() => {
    if (trade) {
      setTicker(trade.ticker);
      setDirection(trade.direction);
      setEntryPrice(trade.entryPrice);
      setExitPrice(trade.exitPrice ?? '');
      setPositionSize(trade.positionSize);
      setOpenedAt(new Date(trade.openedAt));
      setClosedAt(trade.closedAt ? new Date(trade.closedAt) : null);
      setStopLoss(trade.stopLoss ?? '');
      setPlaybookId(trade.playbookId ?? '');
      setNotes(trade.notes ?? '');
    } else {
      setTicker('');
      setDirection('LONG');
      setEntryPrice('');
      setExitPrice('');
      setPositionSize('');
      setOpenedAt(new Date());
      setClosedAt(null);
      setStopLoss('');
      setPlaybookId('');
      setNotes('');
    }
  }, [trade]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openedAt || entryPrice === '' || positionSize === '') {
      return;
    }
    onSubmit({
      ticker,
      direction,
      entryPrice,
      exitPrice: exitPrice === '' ? undefined : exitPrice,
      positionSize,
      openedAt: openedAt.toISOString(),
      closedAt: closedAt?.toISOString(),
      stopLoss: stopLoss === '' ? undefined : stopLoss,
      playbookId: playbookId || undefined,
      notes,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{trade ? 'Edit Trade' : 'New Trade'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ticker"
            fullWidth
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Direction</InputLabel>
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value as TradeDirection)}
            >
              <MenuItem value={'LONG'}>Long</MenuItem>
              <MenuItem value={'SHORT'}>Short</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Entry Price"
            type="number"
            fullWidth
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
          <TextField
            margin="dense"
            label="Exit Price"
            type="number"
            fullWidth
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <TextField
            margin="dense"
            label="Position Size"
            type="number"
            fullWidth
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 1 }}>
              <DateTimePicker
                label="Opened At"
                value={openedAt}
                onChange={setOpenedAt}
              />
              <DateTimePicker
                label="Closed At"
                value={closedAt}
                onChange={setClosedAt}
              />
            </Box>
          </LocalizationProvider>
          <TextField
            margin="dense"
            label="Stop Loss"
            type="number"
            fullWidth
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Playbook</InputLabel>
            <Select
              value={playbookId}
              onChange={(e) => setPlaybookId(e.target.value as string)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {playbooks.map((playbook) => (
                <MenuItem key={playbook.id} value={playbook.id}>
                  {playbook.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {trade ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TradeForm;
