import { calcFees } from '@/lib/feeCalculator';

describe('calcFees', () => {
    test('10% discount on 10000', () => {
        const r = calcFees({ basePrice: 10000, discountPercent: 10 });
        expect(r.discountAmount).toBe(1000);
        expect(r.finalFees).toBe(9000);
        expect(r.discountPercent).toBe(10);
    });

    test('50% discount on 20000', () => {
        const r = calcFees({ basePrice: 20000, discountPercent: 50 });
        expect(r.discountAmount).toBe(10000);
        expect(r.finalFees).toBe(10000);
    });

    test('100% discount yields 0 final', () => {
        const r = calcFees({ basePrice: 5000, discountPercent: 100 });
        expect(r.finalFees).toBe(0);
        expect(r.discountAmount).toBe(5000);
    });

    test('flat discount applied when no percent', () => {
        const r = calcFees({ basePrice: 10000, flatDiscount: 3000 });
        expect(r.discountAmount).toBe(3000);
        expect(r.finalFees).toBe(7000);
        expect(r.discountPercent).toBe(30);
    });

    test('flat discount capped at base price', () => {
        const r = calcFees({ basePrice: 5000, flatDiscount: 9999 });
        expect(r.discountAmount).toBe(5000);
        expect(r.finalFees).toBe(0);
    });

    test('percent takes priority over flat', () => {
        const r = calcFees({ basePrice: 10000, discountPercent: 20, flatDiscount: 5000 });
        expect(r.discountAmount).toBe(2000);
        expect(r.finalFees).toBe(8000);
    });

    test('zero discount returns full price', () => {
        const r = calcFees({ basePrice: 8500 });
        expect(r.discountAmount).toBe(0);
        expect(r.finalFees).toBe(8500);
        expect(r.discountPercent).toBe(0);
    });

    test('negative base price throws', () => {
        expect(() => calcFees({ basePrice: -100 })).toThrow('Base price cannot be negative');
    });

    test('discount percent < 0 throws', () => {
        expect(() => calcFees({ basePrice: 1000, discountPercent: -5 })).toThrow('Discount percent must be between 0 and 100');
    });

    test('discount percent > 100 throws', () => {
        expect(() => calcFees({ basePrice: 1000, discountPercent: 101 })).toThrow('Discount percent must be between 0 and 100');
    });

    test('zero base price with zero discount', () => {
        const r = calcFees({ basePrice: 0 });
        expect(r.finalFees).toBe(0);
        expect(r.discountAmount).toBe(0);
    });

    test('baseCoursePrice in result matches input', () => {
        const r = calcFees({ basePrice: 65000, discountPercent: 15 });
        expect(r.baseCoursePrice).toBe(65000);
    });

    test('rounding on percentage discount', () => {
        const r = calcFees({ basePrice: 333, discountPercent: 33 });
        expect(r.discountAmount).toBe(Math.round((333 * 33) / 100));
        expect(r.finalFees).toBe(333 - r.discountAmount);
    });
});
