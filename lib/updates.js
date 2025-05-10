"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExpoUpdates = __importStar(require("expo-updates"));
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_native_1 = require("react-native");
const types_1 = require("./types");
/**
 * Main class for handling OTA updates from the OpenExpoOTA server
 */
class SelfHostedUpdates {
    constructor(config) {
        this.listeners = [];
        this.isChecking = false;
        this.lastCheck = null;
        /**
         * Handle events from expo-updates
         */
        this.handleExpoUpdateEvent = (event) => {
            this.log('Expo update event:', event);
            // Map expo-updates events to our event types if needed
        };
        if (!config.appKey) {
            throw new Error('appKey is required for OpenExpoOTA client');
        }
        // Set defaults for optional config
        this.config = {
            apiUrl: config.apiUrl,
            appSlug: config.appSlug,
            appKey: config.appKey,
            channel: config.channel || types_1.ReleaseChannel.PRODUCTION,
            runtimeVersion: config.runtimeVersion || expo_constants_1.default.expoConfig?.version || '1.0.0',
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
    async checkForUpdates() {
        if (this.isChecking) {
            this.log('Already checking for updates, skipping');
            return;
        }
        try {
            this.isChecking = true;
            this.emitEvent({ type: 'checking' });
            this.log('Checking for updates...');
            // Get the device platform
            const platformStr = react_native_1.Platform.OS === 'ios' ? 'ios' : 'android';
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
            }
            else {
                this.log('No update available');
                this.emitEvent({ type: 'updateNotAvailable' });
            }
        }
        catch (error) {
            this.log('Error checking for updates:', error);
            this.emitEvent({
                type: 'error',
                error: error instanceof Error ? error : new Error(String(error))
            });
        }
        finally {
            this.isChecking = false;
        }
    }
    /**
     * Download the latest update
     */
    async downloadUpdate() {
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
        }
        catch (error) {
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
    applyUpdate() {
        try {
            this.log('Applying update...');
            ExpoUpdates.reloadAsync();
            this.emitEvent({ type: 'installed' });
        }
        catch (error) {
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
    addEventListener(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    /**
     * Emit an event to all listeners
     */
    emitEvent(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                console.error('Error in update event listener:', error);
            }
        });
    }
    /**
     * Log debug information if debug is enabled
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[OpenExpoOTA]', ...args);
        }
    }
}
exports.default = SelfHostedUpdates;
