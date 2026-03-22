import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import TradeList from '../components/TradeList';
import TradeForm from '../components/TradeForm';
import { type TradeRequest, type TradeResponse } from '../services/tradeService';
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';

const TradesPage: React.FC = () => {
  const {
    trades,
    loading,
    error,
    addTrade,
    updateTrade,
    deleteTrade,
  } = useTrades();
  const [open, setOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] =
    useState<TradeResponse | null>(null);

  const handleOpen = (trade: TradeResponse | null = null) => {
    setSelectedTrade(trade);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTrade(null);
  };

  const handleSubmit = async (trade: TradeRequest) => {
    try {
      if (selectedTrade) {
        await updateTrade(selectedTrade.id, trade);
      } else {
        await addTrade(trade);
      }
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteTrade(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Trades
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
        >
          New Trade
        </Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <TradeList
          trades={trades}
          onEdit={handleOpen}
          onDelete={handleDelete}
        />
      )}

      <TradeForm
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        trade={selectedTrade}
      />
    </Container>
  );
};

export default TradesPage;
