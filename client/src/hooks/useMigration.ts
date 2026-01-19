import { useEffect, useRef } from 'react';
import { commentStorage } from '../services/localStorage';
import { commentApi } from '../services/commentApi';

/**
 * Hook to automatically migrate comments from localStorage to server
 */
export function useMigration(folderName: string | null) {
  const migrationAttempted = useRef(new Set<string>());

  useEffect(() => {
    if (!folderName) return;

    // Only attempt migration once per folder per session
    if (migrationAttempted.current.has(folderName)) return;

    // Check if migration was already done in a previous session
    if (commentStorage.isMigrated(folderName)) return;

    // Get localStorage comments for this folder
    const localComments = commentStorage.getForFolder(folderName);

    if (localComments.length === 0) {
      // No comments to migrate, mark as migrated
      commentStorage.markMigrated(folderName);
      migrationAttempted.current.add(folderName);
      return;
    }

    // Attempt migration
    migrationAttempted.current.add(folderName);

    commentApi
      .migrateComments(folderName, localComments)
      .then((count) => {
        console.log(`✅ Migrated ${count} comments for ${folderName}`);
        // Mark as migrated so we don't try again
        commentStorage.markMigrated(folderName);
        // Optionally: clear localStorage after successful migration
        // commentStorage.clearFolder(folderName);
      })
      .catch((error) => {
        console.error(`❌ Failed to migrate comments for ${folderName}:`, error);
        // Don't mark as migrated so we can retry next time
        migrationAttempted.current.delete(folderName);
      });
  }, [folderName]);
}
