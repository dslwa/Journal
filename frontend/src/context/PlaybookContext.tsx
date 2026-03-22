import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import playbookService, {
  type PlaybookResponse,
  type PlaybookRequest,
} from '../services/playbookService';
import { useAuth } from './AuthContext';

interface PlaybookContextType {
  playbooks: PlaybookResponse[];
  loading: boolean;
  error: string | null;
  addPlaybook: (playbook: PlaybookRequest) => Promise<void>;
  updatePlaybook: (id: string, playbook: PlaybookRequest) => Promise<void>;
  deletePlaybook: (id: string) => Promise<void>;
}

const PlaybookContext = createContext<PlaybookContextType | undefined>(
  undefined
);

export const usePlaybooks = () => {
  const context = useContext(PlaybookContext);
  if (!context) {
    throw new Error('usePlaybooks must be used within a PlaybookProvider');
  }
  return context;
};

interface PlaybookProviderProps {
  children: ReactNode;
}

export const PlaybookProvider: React.FC<PlaybookProviderProps> = ({
  children,
}) => {
  const [playbooks, setPlaybooks] = useState<PlaybookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaybooks();
    } else {
      setPlaybooks([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPlaybooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playbookService.list();
      setPlaybooks(response.data);
    } catch (err) {
      setError('Failed to fetch playbooks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addPlaybook = async (playbook: PlaybookRequest) => {
    try {
      const response = await playbookService.create(playbook);
      setPlaybooks((prev) => [...prev, response.data]);
    } catch (err) {
      setError('Failed to add playbook');
      console.error(err);
      throw err;
    }
  };

  const updatePlaybook = async (id: string, playbook: PlaybookRequest) => {
    try {
      const response = await playbookService.update(id, playbook);
      setPlaybooks((prev) =>
        prev.map((p) => (p.id === id ? response.data : p))
      );
    } catch (err) {
      setError('Failed to update playbook');
      console.error(err);
      throw err;
    }
  };

  const deletePlaybook = async (id: string) => {
    try {
      await playbookService.remove(id);
      setPlaybooks((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Failed to delete playbook');
      console.error(err);
      throw err;
    }
  };

  return (
    <PlaybookContext.Provider
      value={{
        playbooks,
        loading,
        error,
        addPlaybook,
        updatePlaybook,
        deletePlaybook,
      }}
    >
      {children}
    </PlaybookContext.Provider>
  );
};
