import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FolderInfo } from '../types';

export function useFolders() {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFolders() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getFolders();
        setFolders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load folders');
      } finally {
        setLoading(false);
      }
    }

    loadFolders();
  }, []);

  return { folders, loading, error };
}
