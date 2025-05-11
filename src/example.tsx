import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { ReleaseChannel, UpdatesProvider, useSelfHostedUpdates } from './';
import Constants from 'expo-constants';

// Sample configuration for the provider
const config = {
  backendUrl: 'http://localhost:3000/api',
  appSlug: 'example-app',
  appKey: 'your-app-key-from-cli', // Get this from the CLI when you create your app
  channel: ReleaseChannel.DEVELOPMENT,
  checkInterval: 60000, // Check every minute
  updateMode: 'manual' as const, // 'auto' or 'manual'
};

// Sample app showing how to use the OpenExpoOTA client
export default function App() {
  return (
    <UpdatesProvider config={config}>
      <UpdateExample />
    </UpdatesProvider>
  );
}

// Example component that uses the updates hook
function UpdateExample() {
  const {
    isChecking,
    isUpdateAvailable,
    updateInfo,
    checkForUpdates,
    downloadUpdate,
    applyUpdate,
    error,
    progress,
    lastUpdateCheck,
  } = useSelfHostedUpdates();

  // Display the progress percentage
  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  // Update progress when it changes
  useEffect(() => {
    if (progress !== undefined) {
      setProgressPercent(Math.round(progress * 100));
    } else {
      setProgressPercent(null);
    }
  }, [progress]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>OpenExpoOTA Example</Text>

      {/* Status information */}
      <View style={styles.infoBox}>
        <Text>App version: {Constants.expoConfig?.version || 'unknown'}</Text>
        <Text>Last check: {lastUpdateCheck ? new Date(lastUpdateCheck).toLocaleTimeString() : 'Never'}</Text>
        {error && <Text style={styles.error}>Error: {error.message}</Text>}
      </View>

      {/* Update status */}
      {isChecking ? (
        <View style={styles.statusBox}>
          <Text>Checking for updates...</Text>
        </View>
      ) : isUpdateAvailable ? (
        <View style={styles.updateBox}>
          <Text style={styles.updateTitle}>Update Available!</Text>
          {updateInfo && (
            <>
              <Text>Version: {updateInfo.version}</Text>
              <Text>Channel: {updateInfo.channel}</Text>
            </>
          )}

          {/* Download progress or button */}
          {progressPercent !== null ? (
            <View style={styles.progressContainer}>
              <Text>Downloading: {progressPercent}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progress, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          ) : (
            <Button
              title="Download and Apply Update"
              onPress={async () => {
                try {
                  await downloadUpdate();
                  applyUpdate();
                } catch (err) {
                  console.error('Update failed:', err);
                }
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.statusBox}>
          <Text>Your app is up to date</Text>
        </View>
      )}

      {/* Action button */}
      <Button
        title="Check for Updates"
        onPress={checkForUpdates}
        disabled={isChecking || progressPercent !== null}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  updateBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  progressContainer: {
    marginTop: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 5,
  },
  progress: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
});