import * as ExpoUpdates from 'expo-updates';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  SelfHostedUpdateConfig,
  UpdateEvent,
  UpdateEventListener,
  ReleaseChannel
} from './types';

/**
 * Main class for handling OTA updates from the OpenExpoOTA server
 */
export default class SelfHostedUpdates {
  private config: Required<Omit<SelfHostedUpdateConfig, 'appKey'>> & { appKey: string };
  private listeners: UpdateEventListener[] = [];
  private isChecking = false;
  private lastCheck: Date | null = null;

  constructor(config: SelfHostedUpdateConfig) {
    if (!config.appKey) {
      throw new Error('appKey is required for OpenExpoOTA client');
    }

    // Set defaults for optional config
    this.config = {
      apiUrl: config.apiUrl,
      appSlug: config.appSlug,
      appKey: config.appKey,
      channel: config.channel || ReleaseChannel.PRODUCTION,
      runtimeVersion: config.runtimeVersion || Constants.expoConfig?.version || '1.0.0',
      checkOnLaunch: config.checkOnLaunch !== false,
      autoInstall: config.autoInstall !== false,
      debug: config.debug || false
    };

    // Add update listener from expo-updates
    ExpoUpdates.addListener(this.handleExpoUpdateEvent);

    // Check for updates on launch if enabled
    if (this.config.checkOnLaunch) {
      this.checkForUpdates();
    }

    this.log('OpenExpoOTA client initialized');
  }

  /**
   * Check for updates from the server
   */
  async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      this.log('Already checking for updates, skipping');
      return;
    }

    try {
      this.isChecking = true;
      this.emitEvent({ type: 'checking' });
      this.log('Checking for updates...');

      // Get the device platform
      const platformStr = Platform.OS === 'ios' ? 'ios' : 'android';

      // Build the API URL with query parameters
      const url = `${this.config.apiUrl}/apps/${this.config.appSlug}/updates/check?` +
        `channel=${this.config.channel}&` +
        `runtimeVersion=${this.config.runtimeVersion}&` +
        `platform=${platformStr}`;

      // Fetch from the API
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-App-Key': this.config.appKey
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.lastCheck = new Date();

      if (data.available) {
        this.log('Update available:', data.manifest);
        this.emitEvent({
          type: 'updateAvailable',
          manifest: data.manifest
        });

        if (this.config.autoInstall) {
          await this.downloadUpdate();
        }
      } else {
        this.log('No update available');
        this.emitEvent({ type: 'updateNotAvailable' });
      }
    } catch (error) {
      this.log('Error checking for updates:', error);
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Download the latest update
   */
  async downloadUpdate(): Promise<void> {
    try {
      this.log('Downloading update...');
      this.emitEvent({ type: 'downloadStarted' });

      // Use expo-updates to fetch the update
      await ExpoUpdates.fetchUpdateAsync();

      this.log('Update downloaded successfully');
      this.emitEvent({ type: 'downloadFinished' });

      // If auto install is enabled, reload the app
      if (this.config.autoInstall) {
        this.applyUpdate();
      }
    } catch (error) {
      this.log('Error downloading update:', error);
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Apply a downloaded update
   */
  applyUpdate(): void {
    try {
      this.log('Applying update...');
      ExpoUpdates.reloadAsync();
      this.emitEvent({ type: 'installed' });
    } catch (error) {
      this.log('Error applying update:', error);
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: UpdateEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Handle events from expo-updates
   */
  private handleExpoUpdateEvent = (event: any): void => {
    this.log('Expo update event:', event);
    // Map expo-updates events to our event types if needed
  };

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: UpdateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in update event listener:', error);
      }
    });
  }

  /**
   * Log debug information if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[OpenExpoOTA]', ...args);
    }
  }
}