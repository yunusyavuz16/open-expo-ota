import React, { ReactNode } from 'react';
import { ReleaseChannel } from './types';
export interface UpdatesContextValue {
    isChecking: boolean;
    isUpdateAvailable: boolean;
    updateInfo: any | null;
    error: Error | null;
    progress: number | undefined;
    checkForUpdates: () => Promise<void>;
    downloadUpdate: () => Promise<void>;
    applyUpdate: () => void;
    checkOnResume: boolean;
    setCheckOnResume: (check: boolean) => void;
    lastUpdateCheck: Date | null;
}
interface UpdatesProviderProps {
    children: ReactNode;
    config: {
        apiUrl: string;
        appSlug: string;
        appKey: string;
        channel?: ReleaseChannel;
        checkInterval?: number;
        updateMode?: 'auto' | 'manual';
    };
}
export declare const UpdatesProvider: React.FC<UpdatesProviderProps>;
export declare const useSelfHostedUpdates: () => UpdatesContextValue;
export {};
