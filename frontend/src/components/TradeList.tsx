import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { type TradeResponse, type TradeDirection } from '../services/tradeService';

interface TradeListProps {
  trades: TradeResponse[];
  onEdit: (trade: TradeResponse) => void;
  onDelete: (id: string) => void;
}

const TradeList: React.FC<TradeListProps> = ({
  trades,
  onEdit,
  onDelete,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Ticker</TableCell>
            <TableCell>Direction</TableCell>
            <TableCell>Entry Price</TableCell>
            <TableCell>Exit Price</TableCell>
            <TableCell>Position Size</TableCell>
            <TableCell>P&L</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Playbook</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{trade.ticker}</TableCell>
              <TableCell>
                <Chip
                  label={trade.direction}
                  color={
                    trade.direction === 'LONG'
                      ? 'success'
                      : 'error'
                  }
                />
              </TableCell>
              <TableCell>{trade.entryPrice}</TableCell>
              <TableCell>{trade.exitPrice}</TableCell>
              <TableCell>{trade.positionSize}</TableCell>
              <TableCell sx={{
                color: (theme) => {
                  if (trade.pnl == null) return 'inherit';
                  return trade.pnl > 0
                    ? theme.palette.success.main
                    : theme.palette.error.main;
                },
                fontWeight: 'bold'
              }}>
                {trade.pnl?.toFixed(2)}
              </TableCell>
              <TableCell>
                <Chip
                  label={trade.open ? 'Open' : 'Closed'}
                  color={trade.open ? 'primary' : 'default'}
                />
              </TableCell>
              <TableCell>{trade.playbookTitle}</TableCell>
              <TableCell>
                <IconButton onClick={() => onEdit(trade)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => onDelete(trade.id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TradeList;
