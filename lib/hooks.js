"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpdates = void 0;
const react_1 = require("react");
const updates_1 = __importDefault(require("./updates"));
/**
 * Low-level hook for direct access to the SelfHostedUpdates instance
 * This is used internally by the UpdatesProvider
 * Most apps should use the UpdatesProvider and useSelfHostedUpdates instead
 */
const useUpdates = (config) => {
    // Create a ref to store the updates instance
    const updatesRef = (0, react_1.useRef)(null);
    // Store update state
    const [state, setState] = (0, react_1.useState)({
        isChecking: false,
        isDownloading: false,
        isUpdateAvailable: false,
        updateManifest: null,
        error: null,
    });
    // Initialize updates instance
    (0, react_1.useEffect)(() => {
        // Create a new instance with automatic checking disabled
        if (!updatesRef.current) {
            updatesRef.current = new updates_1.default({
                ...config,
                checkOnLaunch: false, // We'll handle checking manually
            });
        }
        // Set up event listener
        const removeListener = updatesRef.current.addEventListener((event) => {
            setState((prev) => {
                switch (event.type) {
                    case 'checking':
                        return {
                            ...prev,
                            isChecking: true,
                            error: null,
                        };
                    case 'updateAvailable':
                        return {
                            ...prev,
                            isChecking: false,
                            isUpdateAvailable: true,
                            updateManifest: event.manifest,
                        };
                    case 'updateNotAvailable':
                        return {
                            ...prev,
                            isChecking: false,
                        };
                    case 'error':
                        return {
                            ...prev,
                            isChecking: false,
                            isDownloading: false,
                            error: event.error,
                        };
                    case 'downloadStarted':
                        return {
                            ...prev,
                            isDownloading: true,
                        };
                    case 'downloadFinished':
                        return {
                            ...prev,
                            isDownloading: false,
                        };
                    case 'installed':
                        return {
                            ...prev,
                            isUpdateAvailable: false,
                            updateManifest: null,
                        };
                    default:
                        return prev;
                }
            });
        });
        // Clean up
        return () => {
            removeListener();
        };
    }, [config.apiUrl, config.appSlug]); // Reinitialize if API URL or app slug changes
    // Check for updates
    const checkForUpdates = async () => {
        if (updatesRef.current && !state.isChecking) {
            await updatesRef.current.checkForUpdates();
        }
    };
    // Download and install update
    const downloadUpdate = async () => {
        if (updatesRef.current && state.isUpdateAvailable && !state.isDownloading) {
            await updatesRef.current.downloadUpdate();
        }
    };
    // Apply update
    const applyUpdate = () => {
        if (updatesRef.current) {
            updatesRef.current.applyUpdate();
        }
    };
    return {
        ...state,
        checkForUpdates,
        downloadUpdate,
        applyUpdate,
    };
};
exports.useUpdates = useUpdates;
