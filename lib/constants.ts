/**
 * Price anomaly detection: flag entries whose z-score exceeds this threshold
 * relative to the user's historical prices for that fuel type. Shared by the
 * live-entry validator, the analytics engine, and the history view so all three
 * flag the same entries.
 */
export const PRICE_ANOMALY_SIGMA = 2.5
