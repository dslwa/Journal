import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import tradeService, {
  type TradeResponse,
  type TradeRequest,
} from '../services/tradeService';
import { useAuth } from './AuthContext';

interface TradeContextType {
  trades: TradeResponse[];
  loading: boolean;
  error: string | null;
  addTrade: (trade: TradeRequest) => Promise<void>;
  updateTrade: (id: string, trade: TradeRequest) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
}

const TradeContext = createContext<TradeContextType | undefined>(
  undefined
);

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
};

interface TradeProviderProps {
  children: ReactNode;
}

export const TradeProvider: React.FC<TradeProviderProps> = ({
  children,
}) => {
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrades();
    } else {
      setTrades([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tradeService.list();
      console.log("TradeContext - otrzymane dane trades:", response.data);
      setTrades(response.data);
    } catch (err) {
      setError('Failed to fetch trades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTrade = async (trade: TradeRequest) => {
    try {
      const response = await tradeService.create(trade);
      setTrades((prev) => [...prev, response.data]);
    } catch (err) {
      setError('Failed to add trade');
      console.error(err);
      throw err;
    }
  };

  const updateTrade = async (id: string, trade: TradeRequest) => {
    try {
      const response = await tradeService.update(id, trade);
      setTrades((prev) =>
        prev.map((t) => (t.id === id ? response.data : t))
      );
    } catch (err) {
      setError('Failed to update trade');
      console.error(err);
      throw err;
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      await tradeService.remove(id);
      setTrades((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError('Failed to delete trade');
      console.error(err);
      throw err;
    }
  };

  return (
    <TradeContext.Provider
      value={{
        trades,
        loading,
        error,
        addTrade,
        updateTrade,
        deleteTrade,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};
