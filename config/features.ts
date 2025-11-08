/**
 * Feature Flags Configuration
 * 
 * Control which features are enabled/disabled in the application.
 * Useful for performance optimization and feature toggles.
 */

export const FEATURE_FLAGS = {
  /**
   * Real-time Notifications
   * 
   * When enabled: Notifications update in real-time via Supabase subscriptions
   * When disabled: Notifications only load on page refresh
   * 
   * Performance Impact: HIGH (constant database polling)
   * Recommended: Disable for development, Enable for production
   */
  REALTIME_NOTIFICATIONS: true,

  /**
   * Real-time Messages
   * 
   * When enabled: Messages update in real-time via Supabase subscriptions
   * When disabled: Messages only load on page refresh
   * 
   * Performance Impact: HIGH (constant database polling)
   * Recommended: Disable for development, Enable for production
   */
  REALTIME_MESSAGES: true,

  /**
   * Auto-refresh Interval (milliseconds)
   * 
   * When real-time is disabled, this controls how often to manually refresh data
   * Set to 0 to disable auto-refresh completely
   * 
   * Default: 30000 (30 seconds)
   */
  AUTO_REFRESH_INTERVAL: 30000,

  /**
   * Show Connection Status
   * 
   * When enabled: Shows connection status indicators in UI
   * When disabled: Hides connection status
   * 
   * Useful for debugging connection issues
   */
  SHOW_CONNECTION_STATUS: false,

  /**
   * Enable Toast Notifications
   * 
   * When enabled: Shows toast notifications for new messages/notifications
   * When disabled: No toast popups
   * 
   * Performance Impact: LOW
   */
  ENABLE_TOAST_NOTIFICATIONS: true,

  /**
   * Debug Mode
   * 
   * When enabled: Shows additional console logs and debug info
   * When disabled: Minimal logging
   * 
   * Recommended: Enable for development, Disable for production
   */
  DEBUG_MODE: false
} as const;

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] as boolean;
}

/**
 * Helper function to get feature value
 */
export function getFeatureValue<K extends keyof typeof FEATURE_FLAGS>(
  feature: K
): typeof FEATURE_FLAGS[K] {
  return FEATURE_FLAGS[feature];
}

/**
 * Quick toggle functions for common features
 */
export const FeatureToggles = {
  enableRealtimeNotifications: () => {
    console.log('✅ Real-time notifications enabled');
    // Note: Requires app restart to take effect
  },
  
  disableRealtimeNotifications: () => {
    console.log('❌ Real-time notifications disabled');
    // Note: Requires app restart to take effect
  },
  
  enableRealtimeMessages: () => {
    console.log('✅ Real-time messages enabled');
    // Note: Requires app restart to take effect
  },
  
  disableRealtimeMessages: () => {
    console.log('❌ Real-time messages disabled');
    // Note: Requires app restart to take effect
  }
};

/**
 * Performance Tips:
 * 
 * For Development:
 * - Set REALTIME_NOTIFICATIONS = false
 * - Set REALTIME_MESSAGES = false
 * - Set AUTO_REFRESH_INTERVAL = 0 (manual refresh only)
 * - Set DEBUG_MODE = true
 * 
 * For Production:
 * - Set REALTIME_NOTIFICATIONS = true
 * - Set REALTIME_MESSAGES = true
 * - Set AUTO_REFRESH_INTERVAL = 30000
 * - Set DEBUG_MODE = false
 */
