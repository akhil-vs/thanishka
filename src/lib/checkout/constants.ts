/** Free shipping when merchandise (after discount) reaches this INR amount. */
export const FREE_SHIPPING_THRESHOLD = 1999;

/** Flat shipping fee in INR when below the free threshold. */
export const SHIPPING_FEE = 99;

export const CHECKOUT_CURRENCY = "INR" as const;

/**
 * Prepaid orders that stay PENDING_PAYMENT past this window are cancelled
 * by the release cron so held stock returns to the floor.
 */
export const PENDING_PAYMENT_HOLD_MINUTES = 45;
