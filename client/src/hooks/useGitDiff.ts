import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DiffFile } from '../types';

export function useGitDiff(folderName: string | null) {
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folderName) {
      setFiles([]);
      return;
    }

    async function loadDiff() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getDiff(folderName);
        setFiles(data.files);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load diff');
        setFiles([]);
      } finally {
        setLoading(false);
      }
    }

    loadDiff();
  }, [folderName]);

  return { files, loading, error };
}
