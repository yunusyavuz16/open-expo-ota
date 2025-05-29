import * as ExpoUpdates from 'expo-updates';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import {
  SelfHostedUpdateConfig,
  UpdateEvent,
  UpdateEventListener,
  ReleaseChannel
} from './types';

// Check if we're running in Expo Go
const isExpoGo = (): boolean => {
  try {
    // Multiple checks to detect Expo Go
    const hasProjectId = Constants.expoConfig?.extra?.eas?.projectId !== undefined;
    const isStoreClient = Constants.executionEnvironment === 'storeClient';
    const isExpoGoApp = Constants.appOwnership === 'expo';

    return !hasProjectId || isStoreClient || isExpoGoApp;
  } catch {
    return true; // Default to Expo Go if we can't determine
  }
};

/**
 * Expo Go compatible update manager that simulates OTA updates
 */
class ExpoGoUpdateManager {
  private config: Required<Omit<SelfHostedUpdateConfig, 'appKey'>> & { appKey?: string };
  private listeners: UpdateEventListener[] = [];
  private manifest: any = null;
  private isChecking = false;

  constructor(config: Required<Omit<SelfHostedUpdateConfig, 'appKey'>> & { appKey?: string }) {
    this.config = config;
  }

  async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      this.log('Already checking for updates, skipping');
      return;
    }

    try {
      this.isChecking = true;
      this.emitEvent({ type: 'checking' });
      this.log('Checking for updates in Expo Go mode...');

      // Get the device platform
      const platformStr = Platform.OS === 'ios' ? 'ios' : 'android';

      // Build the API URL
      const url = `${this.config.backendUrl}/manifest/${this.config.appSlug}?` +
        `channel=${this.config.channel}&` +
        `runtimeVersion=${encodeURIComponent(this.config.runtimeVersion)}&` +
        `platform=${platformStr}`;

      this.log('Fetching from URL:', url);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (this.config.appKey) {
        headers['X-App-Key'] = this.config.appKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          this.log('No updates found for this app and version');
          this.emitEvent({ type: 'updateNotAvailable' });
          return;
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const manifest = await response.json();
      this.manifest = manifest;

      if (manifest && manifest.version) {
        this.log('Update available:', manifest);
        this.emitEvent({
          type: 'updateAvailable',
          manifest
        });

        if (this.config.autoInstall) {
          await this.downloadUpdate();
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

  async downloadUpdate(): Promise<void> {
    try {
      if (!this.manifest) {
        throw new Error('No update available to download');
      }

      this.log('Downloading update in Expo Go...');
      this.emitEvent({ type: 'downloadStarted' });

      // Get the bundle URL from the manifest
      const bundleUrl = this.manifest.bundleUrl;
      if (!bundleUrl) {
        throw new Error('No bundle URL found in manifest');
      }

      // Download the bundle
      const response = await fetch(bundleUrl);
      if (!response.ok) {
        throw new Error(`Failed to download bundle: ${response.status} ${response.statusText}`);
      }

      // Get the bundle content
      const bundleContent = await response.text();

      // Store the bundle in memory (we'll use it when applying the update)
      this.manifest.bundleContent = bundleContent;

      this.log('Download completed');
      this.emitEvent({ type: 'downloadFinished' });

      if (this.config.autoInstall) {
        this.applyUpdate();
      }
    } catch (error) {
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  applyUpdate(): void {
    try {
      this.log('Applying update in Expo Go...');

      if (!this.manifest?.bundleContent) {
        throw new Error('No bundle content available to apply');
      }

      // In Expo Go, we'll use a custom update mechanism
      // This will be handled by the app's update system
      const updateInfo = {
        type: 'expo-go-update',
        manifest: this.manifest,
        bundleContent: this.manifest.bundleContent,
        timestamp: Date.now()
      };

      // Store the update info in memory
      (global as any).__EXPO_GO_UPDATE__ = updateInfo;

      // Show success message
      Alert.alert(
        '✅ Update Ready!',
        'The update has been downloaded and is ready to be applied.\n\n' +
        'Please restart the app to apply the update.',
        [
          {
            text: 'Restart Now',
            onPress: () => {
              // Reset state
              this.manifest = null;
              this.emitEvent({ type: 'installed' });
              // Reload the app
              window.location.reload();
            }
          },
          {
            text: 'Later',
            onPress: () => {
              this.manifest = null;
              this.emitEvent({ type: 'installed' });
            }
          }
        ]
      );

    } catch (error) {
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  addEventListener(listener: UpdateEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: UpdateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in update event listener:', error);
      }
    });
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[OpenExpoOTA]', ...args);
    }
  }
}

/**
 * Main class for handling OTA updates from the OpenExpoOTA server
 */
export default class SelfHostedUpdates {
  private config: Required<Omit<SelfHostedUpdateConfig, 'appKey'>> & { appKey?: string };
  private listeners: UpdateEventListener[] = [];
  private isChecking = false;
  private lastCheck: Date | null = null;
  private expoGoManager: ExpoGoUpdateManager | null = null;
  private isInExpoGo: boolean;

  constructor(config: SelfHostedUpdateConfig) {
    // Set defaults for optional config
    this.config = {
      backendUrl: config.backendUrl || 'http://localhost:3000/api',
      appSlug: config.appSlug,
      appKey: config.appKey,
      channel: config.channel || ReleaseChannel.PRODUCTION,
      runtimeVersion: config.runtimeVersion || Constants.expoConfig?.version || '1.0.0',
      checkOnLaunch: config.checkOnLaunch !== false,
      autoInstall: config.autoInstall !== false,
      debug: config.debug || false
    };

    if (!this.config.appSlug) {
      throw new Error('appSlug is required for OpenExpoOTA client');
    }

    // Detect environment
    this.isInExpoGo = isExpoGo();

    if (this.isInExpoGo) {
      this.log('Running in Expo Go - using simulation mode');
      this.expoGoManager = new ExpoGoUpdateManager(this.config);
    } else {
      this.log('Running in development/production build - using expo-updates');
    }

    // Check for updates on launch if enabled
    if (this.config.checkOnLaunch) {
      setTimeout(() => {
        this.checkForUpdates();
      }, 1000); // Small delay to allow app to initialize
    }

    this.log('OpenExpoOTA client initialized with app slug:', this.config.appSlug);
  }

  /**
   * Check for updates from the server
   */
  async checkForUpdates(): Promise<void> {
    if (this.isInExpoGo && this.expoGoManager) {
      return this.expoGoManager.checkForUpdates();
    }

    if (this.isChecking) {
      this.log('Already checking for updates, skipping');
      return;
    }

    try {
      this.isChecking = true;
      this.emitEvent({ type: 'checking' });
      this.log('Checking for updates...');
      this.log('Current runtime version:', this.config.runtimeVersion);

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
        // Log more details about the manifest
        this.log('Update available:', manifest);
        this.log(`Found version ${manifest.version} - current runtime version is ${this.config.runtimeVersion}`);

        // Quick version comparison for debugging
        const isNewer = this.compareVersions(manifest.version, this.config.runtimeVersion);
        this.log(`Is ${manifest.version} newer than ${this.config.runtimeVersion}? ${isNewer ? 'Yes' : 'No'}`);

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
   * Compare two version strings, returning true if v1 is newer than v2
   */
  private compareVersions(v1: string, v2: string): boolean {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    this.log(`Comparing versions: ${v1} vs ${v2}`);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }

    return false; // Versions are equal
  }

  /**
   * Download the latest update
   */
  async downloadUpdate(manifest?: any): Promise<void> {
    if (this.isInExpoGo && this.expoGoManager) {
      return this.expoGoManager.downloadUpdate();
    }

    try {
      this.log('Downloading update...');
      this.emitEvent({ type: 'downloadStarted' });

      // Configure expo-updates with the manifest URL if provided
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

      // Use expo-updates to fetch the update if available
      if (ExpoUpdates && typeof ExpoUpdates.fetchUpdateAsync === 'function') {
        await ExpoUpdates.fetchUpdateAsync();
        this.log('Update downloaded successfully');
        this.emitEvent({ type: 'downloadFinished' });

        // If auto install is enabled, reload the app
        if (this.config.autoInstall) {
          this.applyUpdate();
        }
      } else {
        throw new Error('ExpoUpdates.fetchUpdateAsync not available');
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
   * Apply the downloaded update
   */
  applyUpdate(): void {
    if (this.isInExpoGo && this.expoGoManager) {
      return this.expoGoManager.applyUpdate();
    }

    try {
      this.log('Applying update...');

      if (ExpoUpdates && typeof ExpoUpdates.reloadAsync === 'function') {
        ExpoUpdates.reloadAsync();
        this.emitEvent({ type: 'installed' });
      } else {
        throw new Error('ExpoUpdates.reloadAsync not available');
      }
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
   * Add an event listener for update events
   */
  addEventListener(listener: UpdateEventListener): () => void {
    if (this.isInExpoGo && this.expoGoManager) {
      return this.expoGoManager.addEventListener(listener);
    }

    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get the last check date
   */
  getLastCheckDate(): Date | null {
    return this.lastCheck;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<typeof this.config> {
    return this.config;
  }

  /**
   * Check if running in Expo Go
   */
  isRunningInExpoGo(): boolean {
    return this.isInExpoGo;
  }

  private emitEvent(event: UpdateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in update event listener:', error);
      }
    });
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[OpenExpoOTA]', ...args);
    }
  }
}