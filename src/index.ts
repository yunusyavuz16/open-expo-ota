// Export core functionality
export { UpdatesProvider, useSelfHostedUpdates } from './provider';
export { useUpdates } from './hooks';

// Export types
export {
  ReleaseChannel,
  Platform,
  SelfHostedUpdateConfig,
  UpdateAvailableEvent,
  UpdateNotAvailableEvent,
  UpdateErrorEvent,
  UpdateDownloadEvent,
  UpdateInstalledEvent,
  UpdateEvent,
  UpdateEventListener
} from './types';

// Export the main class
import SelfHostedUpdates from './updates';
export default SelfHostedUpdates;