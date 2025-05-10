import { SelfHostedUpdateConfig } from './types';
/**
 * Low-level hook for direct access to the SelfHostedUpdates instance
 * This is used internally by the UpdatesProvider
 * Most apps should use the UpdatesProvider and useSelfHostedUpdates instead
 */
export declare const useUpdates: (config: SelfHostedUpdateConfig) => {
    checkForUpdates: () => Promise<void>;
    downloadUpdate: () => Promise<void>;
    applyUpdate: () => void;
    isChecking: boolean;
    isDownloading: boolean;
    isUpdateAvailable: boolean;
    updateManifest: Record<string, any> | null;
    error: Error | null;
};
