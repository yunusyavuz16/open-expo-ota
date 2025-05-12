// Import and apply patching
import { patchExpoConstants, uuidv4 } from './utils';

// Apply patch on module load
patchExpoConstants();

// Export core functionality
export { UpdatesProvider, useSelfHostedUpdates } from './provider';
export { useUpdates } from './hooks';
export { uuidv4 } from './utils';

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