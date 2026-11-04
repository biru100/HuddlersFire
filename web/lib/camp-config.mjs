// Shared limits and timing; this module has no browser, server or physics dependencies.
export const MAX_PLAYERS = 16;
export const CARRY_GAP = 1.3;
export const MAX_HEIGHT = 32;
export const COLORS = ['#e5a76d', '#89b6a5', '#b6a4d4', '#e5acb8', '#8cadd4', '#d8c486'];
export const HOST_LEASE = 20_000;
export const MEMBER_TTL = 90_000;
export const CLEANUP_INTERVAL = 15_000;
export const RTC_STALE = 5_000;
export const RECOVERY_LAG = 90;
export const MAX_UNCONFIRMED_HANDOFFS = 3;
export const WIRE_BASE_TTL = 10_000;
export const WIRE_BASE_LIMIT = 16;
export const WIRE_CACHE_BYTES = 512_000;
