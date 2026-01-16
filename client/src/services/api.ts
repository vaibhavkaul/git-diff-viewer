import { FolderInfo, DiffFile, GitStatus } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error ${response.status}`,
        response.status
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error}`);
  }
}

export const api = {
  async getFolders(): Promise<FolderInfo[]> {
    const data = await fetchJson<{ folders: FolderInfo[] }>(`${API_BASE}/folders`);
    return data.folders;
  },

  async getStatus(folderName: string): Promise<GitStatus> {
    return fetchJson<GitStatus>(`${API_BASE}/status/${encodeURIComponent(folderName)}`);
  },

  async getDiff(folderName: string): Promise<{ diff: string; files: DiffFile[] }> {
    return fetchJson<{ diff: string; files: DiffFile[] }>(
      `${API_BASE}/diff/${encodeURIComponent(folderName)}`
    );
  },

  async getFileContent(folderName: string, filePath: string): Promise<string> {
    const data = await fetchJson<{ content: string }>(
      `${API_BASE}/file/${encodeURIComponent(folderName)}/${filePath}`
    );
    return data.content;
  },
};
