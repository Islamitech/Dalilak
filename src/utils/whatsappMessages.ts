/**
 * Backward-Compatibility Barrel File
 * -----------------------------------------------------------------------------
 * This file preserves 100% backward compatibility for all existing imports across
 * the codebase while delegating implementation to the modularized package:
 *   src/utils/whatsapp/
 * 
 * Modular sub-components:
 * - phoneFormatter.ts
 * - venueContext.ts
 * - financeMessages.ts
 * - googleMapsMessages.ts
 * - onboardingMarketingMessages.ts
 */

export * from './whatsapp';
