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
exports.default = App;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const _1 = require("./");
const expo_constants_1 = __importDefault(require("expo-constants"));
// Sample configuration for the provider
const config = {
    apiUrl: 'http://localhost:3000/api',
    appSlug: 'example-app',
    appKey: 'your-app-key-from-cli', // Get this from the CLI when you create your app
    channel: _1.ReleaseChannel.DEVELOPMENT,
    checkInterval: 60000, // Check every minute
    updateMode: 'manual', // 'auto' or 'manual'
};
// Sample app showing how to use the OpenExpoOTA client
function App() {
    return (<_1.UpdatesProvider config={config}>
      <UpdateExample />
    </_1.UpdatesProvider>);
}
// Example component that uses the updates hook
function UpdateExample() {
    const { isChecking, isUpdateAvailable, updateInfo, checkForUpdates, downloadUpdate, applyUpdate, error, progress, lastUpdateCheck, } = (0, _1.useSelfHostedUpdates)();
    // Display the progress percentage
    const [progressPercent, setProgressPercent] = (0, react_1.useState)(null);
    // Update progress when it changes
    (0, react_1.useEffect)(() => {
        if (progress !== undefined) {
            setProgressPercent(Math.round(progress * 100));
        }
        else {
            setProgressPercent(null);
        }
    }, [progress]);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.header}>OpenExpoOTA Example</react_native_1.Text>

      {/* Status information */}
      <react_native_1.View style={styles.infoBox}>
        <react_native_1.Text>App version: {expo_constants_1.default.expoConfig?.version || 'unknown'}</react_native_1.Text>
        <react_native_1.Text>Last check: {lastUpdateCheck ? new Date(lastUpdateCheck).toLocaleTimeString() : 'Never'}</react_native_1.Text>
        {error && <react_native_1.Text style={styles.error}>Error: {error.message}</react_native_1.Text>}
      </react_native_1.View>

      {/* Update status */}
      {isChecking ? (<react_native_1.View style={styles.statusBox}>
          <react_native_1.Text>Checking for updates...</react_native_1.Text>
        </react_native_1.View>) : isUpdateAvailable ? (<react_native_1.View style={styles.updateBox}>
          <react_native_1.Text style={styles.updateTitle}>Update Available!</react_native_1.Text>
          {updateInfo && (<>
              <react_native_1.Text>Version: {updateInfo.version}</react_native_1.Text>
              <react_native_1.Text>Channel: {updateInfo.channel}</react_native_1.Text>
            </>)}

          {/* Download progress or button */}
          {progressPercent !== null ? (<react_native_1.View style={styles.progressContainer}>
              <react_native_1.Text>Downloading: {progressPercent}%</react_native_1.Text>
              <react_native_1.View style={styles.progressBar}>
                <react_native_1.View style={[styles.progress, { width: `${progressPercent}%` }]}/>
              </react_native_1.View>
            </react_native_1.View>) : (<react_native_1.Button title="Download and Apply Update" onPress={async () => {
                    try {
                        await downloadUpdate();
                        applyUpdate();
                    }
                    catch (err) {
                        console.error('Update failed:', err);
                    }
                }}/>)}
        </react_native_1.View>) : (<react_native_1.View style={styles.statusBox}>
          <react_native_1.Text>Your app is up to date</react_native_1.Text>
        </react_native_1.View>)}

      {/* Action button */}
      <react_native_1.Button title="Check for Updates" onPress={checkForUpdates} disabled={isChecking || progressPercent !== null}/>
    </react_native_1.View>);
}
// Styles
const styles = react_native_1.StyleSheet.create({
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
