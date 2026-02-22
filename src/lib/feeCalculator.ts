/**
 * feeCalculator — Centralized fee calculation utility.
 * All discount logic MUST go through this function to prevent inconsistencies.
 */

export interface FeeCalcInput {
    basePrice: number;
    /** Percentage discount (0–100). Takes priority over flatDiscount if both provided. */
    discountPercent?: number;
    /** Flat amount discount. Only used if discountPercent is 0 or undefined. */
    flatDiscount?: number;
}

export interface FeeCalcResult {
    baseCoursePrice: number;
    discountPercent: number;
    discountAmount: number;
    finalFees: number;
}

export function calcFees({ basePrice, discountPercent = 0, flatDiscount = 0 }: FeeCalcInput): FeeCalcResult {
    // Guard: prices must be non-negative
    if (basePrice < 0) throw new Error('Base price cannot be negative.');
    if (discountPercent < 0 || discountPercent > 100) throw new Error('Discount percent must be between 0 and 100.');

    let discountAmount: number;
    let effectivePercent: number;

    if (discountPercent > 0) {
        // Percentage-based discount
        effectivePercent = discountPercent;
        discountAmount = Math.round((basePrice * discountPercent) / 100);
    } else if (flatDiscount > 0) {
        // Flat amount discount — must not exceed base price
        discountAmount = Math.min(flatDiscount, basePrice);
        effectivePercent = Math.round((discountAmount / basePrice) * 100);
    } else {
        discountAmount = 0;
        effectivePercent = 0;
    }

    const finalFees = basePrice - discountAmount;
    return {
        baseCoursePrice: basePrice,
        discountPercent: effectivePercent,
        discountAmount,
        finalFees,
    };
}
