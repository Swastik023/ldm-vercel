/**
 * Performance Guards
 * Ensures critical business logic functions execute within acceptable thresholds.
 * These are unit-level execution time guards, not E2E latency tests.
 */

import { calcFees } from '@/lib/feeCalculator';
import { parseMCQText } from '@/lib/mcqParser';

function generateBulkMCQ(count: number): string {
    return Array.from({ length: count }, (_, i) => `
Q${i + 1}. Question number ${i + 1} about topic ${i}?
A) Option Alpha ${i}
B) Option Beta ${i}
C) Option Gamma ${i}
D) Option Delta ${i}
Answer: ${['A', 'B', 'C', 'D'][i % 4]}`).join('\n');
}

describe('Performance: calcFees', () => {
    test('1000 fee calculations under 50ms', () => {
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            calcFees({ basePrice: 50000 + i, discountPercent: i % 100 });
        }
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(50);
    });

    test('10000 fee calculations under 200ms', () => {
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
            calcFees({ basePrice: 100000, discountPercent: 15, flatDiscount: 5000 });
        }
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(200);
    });
});

describe('Performance: parseMCQText', () => {
    test('50 questions parsed under 100ms', () => {
        const input = generateBulkMCQ(50);
        const start = performance.now();
        const result = parseMCQText(input);
        const elapsed = performance.now() - start;
        expect(result.questions.length).toBe(50);
        expect(elapsed).toBeLessThan(100);
    });

    test('200 questions parsed under 500ms', () => {
        const input = generateBulkMCQ(200);
        const start = performance.now();
        const result = parseMCQText(input);
        const elapsed = performance.now() - start;
        expect(result.questions.length).toBe(200);
        expect(elapsed).toBeLessThan(500);
    });

    test('malformed input (1000 lines of garbage) does not hang', () => {
        const garbage = Array.from({ length: 1000 }, (_, i) => `random line ${i} with no pattern`).join('\n');
        const start = performance.now();
        parseMCQText(garbage);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(200);
    });
});
