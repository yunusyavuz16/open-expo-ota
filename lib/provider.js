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
exports.useSelfHostedUpdates = exports.UpdatesProvider = void 0;
const react_1 = __importStar(require("react"));
const updates_1 = __importDefault(require("./updates"));
// Create context with default values
const UpdatesContext = (0, react_1.createContext)(undefined);
// Convert provider config to SelfHostedUpdateConfig
const convertConfig = (config) => {
    return {
        backendUrl: config.backendUrl,
        appSlug: config.appSlug,
        appKey: config.appKey,
        channel: config.channel,
        autoInstall: config.updateMode === 'auto',
        checkOnLaunch: true,
    };
};
// Provider component
const UpdatesProvider = ({ children, config }) => {
    const [isChecking, setIsChecking] = (0, react_1.useState)(false);
    const [isUpdateAvailable, setIsUpdateAvailable] = (0, react_1.useState)(false);
    const [updateInfo, setUpdateInfo] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [progress, setProgress] = (0, react_1.useState)(undefined);
    const [checkOnResume, setCheckOnResume] = (0, react_1.useState)(true);
    const [lastUpdateCheck, setLastUpdateCheck] = (0, react_1.useState)(null);
    const [updates] = (0, react_1.useState)(() => new updates_1.default(convertConfig(config)));
    // Set up event listener
    (0, react_1.useEffect)(() => {
        const removeListener = updates.addEventListener((event) => {
            switch (event.type) {
                case 'checking':
                    setIsChecking(true);
                    setError(null);
                    break;
                case 'updateAvailable':
                    setIsChecking(false);
                    setIsUpdateAvailable(true);
                    setUpdateInfo(event.manifest);
                    setLastUpdateCheck(new Date());
                    break;
                case 'updateNotAvailable':
                    setIsChecking(false);
                    setIsUpdateAvailable(false);
                    setLastUpdateCheck(new Date());
                    break;
                case 'error':
                    setIsChecking(false);
                    setError(event.error);
                    break;
                case 'downloadStarted':
                    setProgress(0);
                    break;
                case 'downloadProgress':
                    if (event.progress !== undefined) {
                        setProgress(event.progress);
                    }
                    break;
                case 'downloadFinished':
                    setProgress(1);
                    break;
                case 'installed':
                    setIsUpdateAvailable(false);
                    setUpdateInfo(null);
                    break;
            }
        });
        // Check for updates at the specified interval
        let intervalId;
        if (config.checkInterval) {
            intervalId = setInterval(() => {
                checkForUpdates();
            }, config.checkInterval);
        }
        return () => {
            removeListener();
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [config.checkInterval]);
    // Check for updates
    const checkForUpdates = async () => {
        await updates.checkForUpdates();
    };
    // Download the available update
    const downloadUpdate = async () => {
        await updates.downloadUpdate();
    };
    // Apply the downloaded update
    const applyUpdate = () => {
        updates.applyUpdate();
    };
    // Context value
    const value = {
        isChecking,
        isUpdateAvailable,
        updateInfo,
        error,
        progress,
        checkForUpdates,
        downloadUpdate,
        applyUpdate,
        checkOnResume,
        setCheckOnResume,
        lastUpdateCheck,
    };
    return (<UpdatesContext.Provider value={value}>
      {children}
    </UpdatesContext.Provider>);
};
exports.UpdatesProvider = UpdatesProvider;
// Custom hook to use updates context
const useSelfHostedUpdates = () => {
    const context = (0, react_1.useContext)(UpdatesContext);
    if (context === undefined) {
        throw new Error('useSelfHostedUpdates must be used within an UpdatesProvider');
    }
    return context;
};
exports.useSelfHostedUpdates = useSelfHostedUpdates;
