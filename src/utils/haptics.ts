/**
 * Safe Mobile Haptic Feedback Utility
 * Provides micro-tactile feedback on modern touch devices supporting navigator.vibrate
 */

export type HapticType = 'light' | 'medium' | 'success' | 'warning' | 'selection';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
      case 'selection':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 60, 25]);
        break;
      case 'warning':
        navigator.vibrate([35, 40, 35]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (err) {
    // Ignore any browser security restrictions or unsupported vibration
  }
}
