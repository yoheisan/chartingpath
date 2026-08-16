/**
 * Sample-size floors. Every user-facing rate must clear its floor before we
 * print a number — below it we print the sample instead. A win rate from
 * three trades is noise dressed up as a measurement.
 */
export const MIN_WIN_RATE_SAMPLE = 30;
/** Forward record per cell: below this we say "building record". */
export const MIN_FORWARD_SAMPLE = 30;
/** Cell decay: only flag a validated cell once it has this much forward data. */
export const MIN_DECAY_SAMPLE = 50;
