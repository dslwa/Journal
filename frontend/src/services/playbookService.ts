import api from './api';
import type { AxiosResponse } from 'axios';

export interface PlaybookResponse {
  id: string;
  title: string;
  description: string;
  rules: string;
  setup: string;
  timeframe: string;
  riskNote: string;
}

export interface PlaybookRequest {
  title: string;
  description: string;
  rules: string;
  setup: string;
  timeframe: string;
  riskNote: string;
}

const list = (): Promise<AxiosResponse<PlaybookResponse[]>> => {
  return api.get('/api/playbooks');
};

const create = (playbook: PlaybookRequest): Promise<AxiosResponse<PlaybookResponse>> => {
  return api.post('/api/playbooks', playbook);
};

const update = (id: string, playbook: PlaybookRequest): Promise<AxiosResponse<PlaybookResponse>> => {
  return api.put(`/api/playbooks/${id}`, playbook);
};

const remove = (id: string): Promise<AxiosResponse<void>> => {
  return api.delete(`/api/playbooks/${id}`);
};

const playbookService = {
  list,
  create,
  update,
  remove,
};

export default playbookService;