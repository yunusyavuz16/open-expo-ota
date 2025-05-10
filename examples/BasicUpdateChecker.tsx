import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import { UpdatesProvider, useSelfHostedUpdates, ReleaseChannel } from '../src';
import Constants from 'expo-constants';

/**
 * This is a complete example of a basic update checker component.
 * It shows how to use the OpenExpoOTA client library to check for updates.
 */

// Config for the UpdatesProvider
const updatesConfig = {
  apiUrl: 'http://localhost:3000/api',
  appSlug: 'your-app-slug',
  appKey: 'your-app-key', // This is provided by the CLI when you initialize your app
  channel: ReleaseChannel.DEVELOPMENT,
  checkInterval: 60000, // Check every minute
  updateMode: 'manual' as const, // 'auto' or 'manual'
};

// Root component that wraps your app with the UpdatesProvider
export default function App() {
  return (
    <UpdatesProvider config={updatesConfig}>
      <BasicUpdateChecker />
    </UpdatesProvider>
  );
}

// The actual update checker component
function BasicUpdateChecker() {
  const {
    isChecking,
    isUpdateAvailable,
    updateInfo,
    checkForUpdates,
    downloadUpdate,
    applyUpdate,
    lastUpdateCheck,
    error,
    progress,
  } = useSelfHostedUpdates();

  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  // Update progress percentage when download progress changes
  useEffect(() => {
    if (progress !== undefined) {
      setProgressPercent(Math.round(progress * 100));
    } else {
      setProgressPercent(null);
    }
  }, [progress]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenExpoOTA Update Checker</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>App Version: {Constants.expoConfig?.version}</Text>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>
          Last Check: {lastUpdateCheck ? new Date(lastUpdateCheck).toLocaleTimeString() : 'Never'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      )}

      {isChecking ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Checking for updates...</Text>
        </View>
      ) : isUpdateAvailable ? (
        <View style={styles.updateBox}>
          <Text style={styles.updateTitle}>Update Available!</Text>
          {updateInfo && (
            <>
              <Text style={styles.updateText}>Version: {updateInfo.version}</Text>
              <Text style={styles.updateText}>Channel: {updateInfo.channel}</Text>
            </>
          )}

          {progressPercent !== null ? (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Downloading: {progressPercent}%</Text>
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
                  console.error('Failed to apply update:', err);
                }
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Your app is up to date!</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Check for Updates"
          onPress={checkForUpdates}
          disabled={isChecking || progressPercent !== null}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  statusBox: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#0077cc',
  },
  updateBox: {
    backgroundColor: '#e8f8ef',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00aa55',
    marginBottom: 10,
  },
  updateText: {
    fontSize: 16,
    marginBottom: 5,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  buttonContainer: {
    marginTop: 10,
  },
  progressContainer: {
    marginTop: 15,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  progress: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
});