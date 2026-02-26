import { parseMCQText } from '@/lib/mcqParser';

const VALID_BLOCK = `Q1. What is the capital of France?
A) Berlin
B) Paris
C) Rome
D) Madrid
Answer: B`;

const VALID_BLOCK_2 = `Q2. Which planet is closest to the Sun?
A) Venus
B) Mercury
C) Mars
D) Earth
Answer: B`;

describe('parseMCQText', () => {
    test('parses a valid single question', () => {
        const { questions, errors } = parseMCQText(VALID_BLOCK);
        expect(questions).toHaveLength(1);
        expect(errors).toHaveLength(0);
        expect(questions[0].questionText).toBe('What is the capital of France?');
        expect(questions[0].correctAnswer).toBe('B');
        expect(questions[0].options).toHaveLength(4);
    });

    test('parses multiple questions', () => {
        const { questions, errors } = parseMCQText(`${VALID_BLOCK}\n${VALID_BLOCK_2}`);
        expect(questions).toHaveLength(2);
        expect(errors).toHaveLength(0);
    });

    test('handles "1." prefix format', () => {
        const input = `1. What is 2+2?
A) 3
B) 4
C) 5
D) 6
Answer: B`;
        const { questions } = parseMCQText(input);
        expect(questions).toHaveLength(1);
        expect(questions[0].questionText).toBe('What is 2+2?');
    });

    test('handles "Ans:" answer format', () => {
        const input = `Q1. Test question?
A) One
B) Two
C) Three
D) Four
Ans: C`;
        const { questions } = parseMCQText(input);
        expect(questions[0].correctAnswer).toBe('C');
    });

    test('handles "Correct Answer:" format', () => {
        const input = `Q1. Test question?
A) One
B) Two
C) Three
D) Four
Correct Answer: D`;
        const { questions } = parseMCQText(input);
        expect(questions[0].correctAnswer).toBe('D');
    });

    test('handles option format with dots (A.)', () => {
        const input = `Q1. Test question?
A. Alpha
B. Beta
C. Gamma
D. Delta
Answer: A`;
        const { questions } = parseMCQText(input);
        expect(questions).toHaveLength(1);
        expect(questions[0].options[0].text).toBe('Alpha');
    });

    test('missing answer line produces error', () => {
        const input = `Q1. No answer here?
A) One
B) Two
C) Three
D) Four`;
        const { questions, errors } = parseMCQText(input);
        expect(questions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('No Answer line found');
    });

    test('less than 4 options produces error', () => {
        const input = `Q1. Only two options?
A) One
B) Two
Answer: A`;
        const { questions, errors } = parseMCQText(input);
        expect(questions).toHaveLength(0);
        expect(errors[0]).toContain('option');
    });

    test('duplicate question is deduped', () => {
        const doubled = `${VALID_BLOCK}\n${VALID_BLOCK}`;
        const { questions, errors } = parseMCQText(doubled);
        expect(questions).toHaveLength(1);
        expect(errors.some(e => e.includes('Duplicate'))).toBe(true);
    });

    test('empty input produces error', () => {
        const { questions, errors } = parseMCQText('');
        expect(questions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    test('answer outside A-D range treated as no answer', () => {
        const input = `Q1. Mismatched answer?
A) One
B) Two
C) Three
D) Four
Answer: Z`;
        const { questions, errors } = parseMCQText(input);
        expect(questions).toHaveLength(0);
        expect(errors[0]).toContain('No Answer line found');
    });

    test('short block (< 3 lines) skipped', () => {
        const input = `Q1. Too short
Answer: A`;
        const { questions, errors } = parseMCQText(input);
        expect(questions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
    });

    test('lowercase option labels normalized to uppercase', () => {
        const input = `Q1. Lowercase options?
a) One
b) Two
c) Three
d) Four
Answer: a`;
        const { questions } = parseMCQText(input);
        expect(questions[0].options[0].label).toBe('A');
        expect(questions[0].correctAnswer).toBe('A');
    });
});
