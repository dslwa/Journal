import api from './api';
import type { AxiosResponse } from 'axios';

export type TradeDirection = 'LONG' | 'SHORT';

export interface TradeResponse {
  id: string;
  ticker: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  openedAt: string; // ISO date string
  closedAt?: string; // ISO date string
  stopLoss?: number;
  playbookId?: string;
  playbookTitle?: string;
  notes?: string;
  pnl?: number;
  open: boolean;
}

export interface TradeRequest {
  ticker: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  openedAt: string; // ISO date string
  closedAt?: string;
  stopLoss?: number;
  playbookId?: string;
  notes?: string;
}

const list = (): Promise<AxiosResponse<TradeResponse[]>> => {
  return api.get("/api/api/trades");
};

const create = (trade: TradeRequest): Promise<AxiosResponse<TradeResponse>> => {
  return api.post('/api/trades', trade);
};

const update = (id: string, trade: TradeRequest): Promise<AxiosResponse<TradeResponse>> => {
  return api.put(`/api/trades/${id}`, trade);
};

const remove = (id: string): Promise<AxiosResponse<void>> => {
  return api.delete(`/api/trades/${id}`);
};

const tradeService = {
  list,
  create,
  update,
  remove,
};

export default tradeService;