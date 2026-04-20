/**
 * Price anomaly detection: flag entries whose z-score exceeds this threshold
 * relative to the user's historical prices for that fuel type. Shared by the
 * live-entry validator, the analytics engine, and the history view so all three
 * flag the same entries.
 */
export const PRICE_ANOMALY_SIGMA = 2.5

/**
 * Odometer jump threshold: consecutive entries whose odometer delta exceeds
 * this value are flagged as suspicious in the history view and the validator.
 * Shared constant so both surfaces flag the same gap size.
 */
export const ODOMETER_JUMP_KM = 2000
