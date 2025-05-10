import { SelfHostedUpdateConfig, UpdateEventListener } from './types';
/**
 * Main class for handling OTA updates from the OpenExpoOTA server
 */
export default class SelfHostedUpdates {
    private config;
    private listeners;
    private isChecking;
    private lastCheck;
    constructor(config: SelfHostedUpdateConfig);
    /**
     * Check for updates from the server
     */
    checkForUpdates(): Promise<void>;
    /**
     * Download the latest update
     */
    downloadUpdate(): Promise<void>;
    /**
     * Apply a downloaded update
     */
    applyUpdate(): void;
    /**
     * Add an event listener
     */
    addEventListener(listener: UpdateEventListener): () => void;
    /**
     * Handle events from expo-updates
     */
    private handleExpoUpdateEvent;
    /**
     * Emit an event to all listeners
     */
    private emitEvent;
    /**
     * Log debug information if debug is enabled
     */
    private log;
}
