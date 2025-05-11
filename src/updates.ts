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
  private config: Required<Omit<SelfHostedUpdateConfig, 'appKey'>> & { appKey?: string };
  private listeners: UpdateEventListener[] = [];
  private isChecking = false;
  private lastCheck: Date | null = null;

  constructor(config: SelfHostedUpdateConfig) {
    // Set defaults for optional config
    this.config = {
      backendUrl: config.backendUrl || 'http://localhost:3000/api',
      appSlug: config.appSlug,
      appKey: config.appKey, // Now optional
      channel: config.channel || ReleaseChannel.PRODUCTION,
      runtimeVersion: config.runtimeVersion || Constants.expoConfig?.version || '1.0.0',
      checkOnLaunch: config.checkOnLaunch !== false,
      autoInstall: config.autoInstall !== false,
      debug: config.debug || false
    };

    if (!this.config.appSlug) {
      throw new Error('appSlug is required for OpenExpoOTA client');
    }

    // Add update listener from expo-updates
    ExpoUpdates.addListener(this.handleExpoUpdateEvent);

    // Check for updates on launch if enabled
    if (this.config.checkOnLaunch) {
      this.checkForUpdates();
    }

    this.log('OpenExpoOTA client initialized with app slug:', this.config.appSlug);
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
      const url = `${this.config.backendUrl}/manifest/${this.config.appSlug}?` +
        `channel=${this.config.channel}&` +
        `runtimeVersion=${encodeURIComponent(this.config.runtimeVersion)}&` +
        `platform=${platformStr}`;

      this.log('Fetching from URL:', url);

      // Fetch from the API
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Add app key if provided (backward compatibility)
      if (this.config.appKey) {
        headers['X-App-Key'] = this.config.appKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 404) {
          this.log('No updates found for this app and version');
          this.emitEvent({ type: 'updateNotAvailable' });
          return;
        }

        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const manifest = await response.json();
      this.lastCheck = new Date();

      if (manifest && manifest.version) {
        this.log('Update available:', manifest);
        this.emitEvent({
          type: 'updateAvailable',
          manifest
        });

        if (this.config.autoInstall) {
          await this.downloadUpdate(manifest);
        }
      } else {
        this.log('No update available or invalid manifest');
        this.emitEvent({ type: 'updateNotAvailable' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error checking for updates:', errorMessage);
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
  async downloadUpdate(manifest?: any): Promise<void> {
    try {
      this.log('Downloading update...');
      this.emitEvent({ type: 'downloadStarted' });

      // Configure expo-updates with the manifest URL
      if (manifest && manifest.bundleUrl) {
        // Update the bundleUrl to use the public endpoint if it's a relative URL
        if (manifest.bundleUrl.startsWith('/')) {
          manifest.bundleUrl = `${this.config.backendUrl}${manifest.bundleUrl}`;
        }

        // Update any asset URLs to use the public endpoints
        if (manifest.assets && Array.isArray(manifest.assets)) {
          manifest.assets = manifest.assets.map((asset: any) => {
            if (asset.url && asset.url.startsWith('/')) {
              asset.url = `${this.config.backendUrl}${asset.url}`;
            }
            return asset;
          });
        }
      }

      // Use expo-updates to fetch the update
      await ExpoUpdates.fetchUpdateAsync();

      this.log('Update downloaded successfully');
      this.emitEvent({ type: 'downloadFinished' });

      // If auto install is enabled, reload the app
      if (this.config.autoInstall) {
        this.applyUpdate();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error downloading update:', errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('Error applying update:', errorMessage);
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