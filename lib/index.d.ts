export { UpdatesProvider, useSelfHostedUpdates } from './provider';
export { useUpdates } from './hooks';
export { ReleaseChannel, Platform, SelfHostedUpdateConfig, UpdateAvailableEvent, UpdateNotAvailableEvent, UpdateErrorEvent, UpdateDownloadEvent, UpdateInstalledEvent, UpdateEvent, UpdateEventListener } from './types';
import SelfHostedUpdates from './updates';
export default SelfHostedUpdates;
