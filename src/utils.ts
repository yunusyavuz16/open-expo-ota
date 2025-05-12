import { v4 as uuidv4Original } from 'uuid';

/**
 * Provides a UUID v4 implementation that is compatible across different versions of the uuid library.
 * This helps to avoid conflicts when multiple versions of the uuid library are present.
 */
export const uuidv4 = (): string => {
  try {
    return uuidv4Original();
  } catch (error) {
    // Fallback to a simple UUID implementation if the main one fails
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export a patch function for expo-constants
export const patchExpoConstants = () => {
  try {
    // Try to patch the expo-constants module to use our uuidv4 implementation
    const Constants = require('expo-constants');
    if (Constants && Constants.default) {
      // Add our implementation to the module
      const originalModule = Constants.default;
      originalModule.uuidv4 = uuidv4;
    }
  } catch (error) {
    console.warn('Failed to patch expo-constants:', error);
  }
};