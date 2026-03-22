import React from 'react';
import { useTrades } from '../context/TradeContext';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { type TradeDirection } from '../services/tradeService';

const DashboardPage: React.FC = () => {
  const { trades, loading, error } = useTrades();

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const totalTrades = trades.length;
  const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
  const winningTrades = trades.filter((trade) => (trade.pnl || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const pnlOverTimeData = trades
    .filter((trade) => !trade.open)
    .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime())
    .map((trade) => ({
      date: new Date(trade.closedAt!).toLocaleDateString(),
      pnl: trade.pnl,
    }));

  const tradeDirectionData = [
    {
      name: 'Long',
      value: trades.filter((t) => t.direction === 'LONG').length,
    },
    {
      name: 'Short',
      value: trades.filter((t) => t.direction === 'SHORT').length,
    },
  ];

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <Container>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Trades</Typography>
              <Typography variant="h4">{totalTrades}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total P&L</Typography>
              <Typography variant="h4" color={totalPnl >= 0 ? 'success.main' : 'error.main'}>
                ${totalPnl.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Win Rate</Typography>
              <Typography variant="h4">{winRate.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">P&L Over Time</Typography>
              {pnlOverTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pnlOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pnl" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No closed trades with P&L to display.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Trade Direction</Typography>
              {tradeDirectionData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tradeDirectionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {tradeDirectionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No trades to display direction for.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
