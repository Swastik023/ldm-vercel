/**
 * parseMCQText — Reusable MCQ parser
 *
 * Parses a raw string of MCQ questions in the format:
 * Q1. Question text?
 * A) Option A
 * B) Option B
 * C) Option C
 * D) Option D
 * Answer: B
 *
 * Supports:
 * - Prefix variants: Q1., Q 1., 1., 1)
 * - Option prefix variants: A) A. (A) a)
 * - Answer variants: Answer: B, Ans: B, Correct: B, Correct Answer: B
 * - Flexible whitespace and line endings
 */

export interface ParsedQuestion {
    questionText: string;
    options: { label: string; text: string }[];
    correctAnswer: string;
}

export interface ParseResult {
    questions: ParsedQuestion[];
    errors: string[];
}

export function parseMCQText(raw: string): ParseResult {
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];
    const seenQuestions = new Set<string>();

    // Split into question blocks — split on Q1., 1., Q 1. etc at line start
    const blocks = raw
        .split(/\n(?=\s*(?:Q\s*\d+[\.\)]|\d+[\.\)])\s)/i)
        .map(b => b.trim())
        .filter(b => b.length > 0);

    if (blocks.length === 0) {
        errors.push('No questions found. Please check the format and try again.');
        return { questions, errors };
    }

    blocks.forEach((block, blockIndex) => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 3) {
            errors.push(`Block ${blockIndex + 1}: Too short to be a valid question — skipped.`);
            return;
        }

        // Extract question text (first line, remove Q1. prefix)
        const questionText = lines[0]
            .replace(/^(?:Q\s*\d+[\.\)]|\d+[\.\)])\s*/i, '')
            .trim();

        if (!questionText) {
            errors.push(`Block ${blockIndex + 1}: Empty question text — skipped.`);
            return;
        }

        // Deduplicate
        const normalizedQ = questionText.toLowerCase().replace(/\s+/g, ' ');
        if (seenQuestions.has(normalizedQ)) {
            errors.push(`Duplicate question skipped: "${questionText.slice(0, 60)}…"`);
            return;
        }

        // Extract options (lines starting with A), B), A., (A) etc.)
        const optionPattern = /^[\(\[]?([A-Da-d])[\)\]\.\s]\s*(.+)$/;
        const options: { label: string; text: string }[] = [];
        let answerLine = '';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const answerMatch = line.match(/^(?:answer|ans|correct(?:\s+answer)?)\s*[:=\-]\s*([A-Da-d])/i);
            if (answerMatch) {
                answerLine = answerMatch[1].toUpperCase();
                continue;
            }
            const optMatch = line.match(optionPattern);
            if (optMatch) {
                options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
            }
        }

        // Validate: need exactly 4 options
        if (options.length < 4) {
            errors.push(`Question "${questionText.slice(0, 50)}…": Found only ${options.length} option(s). Need 4 — skipped.`);
            return;
        }

        // Validate: need an answer
        if (!answerLine) {
            errors.push(`Question "${questionText.slice(0, 50)}…": No Answer line found — skipped.`);
            return;
        }

        // Check answer matches an option
        const validLabels = options.map(o => o.label);
        if (!validLabels.includes(answerLine)) {
            errors.push(`Question "${questionText.slice(0, 50)}…": Answer "${answerLine}" doesn't match any option — skipped.`);
            return;
        }

        seenQuestions.add(normalizedQ);
        questions.push({
            questionText,
            options: options.slice(0, 4), // Take exactly 4
            correctAnswer: answerLine,
        });
    });

    if (questions.length === 0 && errors.length === 0) {
        errors.push('No valid questions could be extracted. Please check the format.');
    }

    return { questions, errors };
}
