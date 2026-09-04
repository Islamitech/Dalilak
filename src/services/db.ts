/**
 * 🏛️ Live Supabase Database Service (Modular Facade)
 * 100% Cloud-native persistent CRUD operations with automated schema conversion
 * and multi-layer caching (LocalStorage + Local Server + Supabase Cloud).
 *
 * Modularized into focused domain modules under ./db/ with 100% backwards compatibility.
 */

export * from './db/dbMappers';
export * from './db/businessDb';
export * from './db/repDb';
export * from './db/payoutDb';
export * from './db/leadDb';
export * from './db/paymentConfigDb';
