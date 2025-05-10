import { useState, useEffect, useRef } from 'react';
import SelfHostedUpdates from './updates';
import { SelfHostedUpdateConfig, UpdateEvent } from './types';

/**
 * State interface for useUpdates hook
 */
interface UseUpdatesState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  updateManifest: Record<string, any> | null;
  error: Error | null;
}

/**
 * Low-level hook for direct access to the SelfHostedUpdates instance
 * This is used internally by the UpdatesProvider
 * Most apps should use the UpdatesProvider and useSelfHostedUpdates instead
 */
export const useUpdates = (config: SelfHostedUpdateConfig) => {
  // Create a ref to store the updates instance
  const updatesRef = useRef<SelfHostedUpdates | null>(null);

  // Store update state
  const [state, setState] = useState<UseUpdatesState>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    updateManifest: null,
    error: null,
  });

  // Initialize updates instance
  useEffect(() => {
    // Create a new instance with automatic checking disabled
    if (!updatesRef.current) {
      updatesRef.current = new SelfHostedUpdates({
        ...config,
        checkOnLaunch: false, // We'll handle checking manually
      });
    }

    // Set up event listener
    const removeListener = updatesRef.current.addEventListener((event: UpdateEvent) => {
      setState((prev) => {
        switch (event.type) {
          case 'checking':
            return {
              ...prev,
              isChecking: true,
              error: null,
            };

          case 'updateAvailable':
            return {
              ...prev,
              isChecking: false,
              isUpdateAvailable: true,
              updateManifest: event.manifest,
            };

          case 'updateNotAvailable':
            return {
              ...prev,
              isChecking: false,
            };

          case 'error':
            return {
              ...prev,
              isChecking: false,
              isDownloading: false,
              error: event.error,
            };

          case 'downloadStarted':
            return {
              ...prev,
              isDownloading: true,
            };

          case 'downloadFinished':
            return {
              ...prev,
              isDownloading: false,
            };

          case 'installed':
            return {
              ...prev,
              isUpdateAvailable: false,
              updateManifest: null,
            };

          default:
            return prev;
        }
      });
    });

    // Clean up
    return () => {
      removeListener();
    };
  }, [config.apiUrl, config.appSlug]); // Reinitialize if API URL or app slug changes

  // Check for updates
  const checkForUpdates = async () => {
    if (updatesRef.current && !state.isChecking) {
      await updatesRef.current.checkForUpdates();
    }
  };

  // Download and install update
  const downloadUpdate = async () => {
    if (updatesRef.current && state.isUpdateAvailable && !state.isDownloading) {
      await updatesRef.current.downloadUpdate();
    }
  };

  // Apply update
  const applyUpdate = () => {
    if (updatesRef.current) {
      updatesRef.current.applyUpdate();
    }
  };

  return {
    ...state,
    checkForUpdates,
    downloadUpdate,
    applyUpdate,
  };
};