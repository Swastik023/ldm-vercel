/**
 * testSchemaValidator.ts
 * Validates questions.json and answers.json uploaded by teachers.
 * Returns structured errors rather than throwing.
 */

export interface UploadedOption {
    label: string;
    text: string;
}

export interface UploadedQuestion {
    questionId: string;
    sectionId?: string;
    type: string;
    questionText: string;
    marks: number;
    options: UploadedOption[];
}

export interface UploadedSection {
    sectionId: string;
    title: string;
    instructions?: string;
}

export interface UploadedTestMeta {
    title: string;
    description?: string;
    durationMinutes: number;
    totalMarks: number;
    batch: string;       // ObjectId string
    subject: string;     // ObjectId string
    negativeMarking?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    resultMode?: 'instant' | 'manual';
}

export interface UploadedQuestionsFile {
    testMeta: UploadedTestMeta;
    sections?: UploadedSection[];
    questions: UploadedQuestion[];
}

export interface UploadedAnswerEntry {
    questionId: string;
    correctAnswer: string;
    reason?: string;
}

export interface UploadedAnswersFile {
    testTitle: string;
    answers: UploadedAnswerEntry[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// ── Validate questions.json ────────────────────────────────────────────────
export function validateQuestionsFile(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { valid: false, errors: ['questions.json must be a JSON object.'], warnings };
    }

    const d = data as Record<string, unknown>;

    // testMeta
    if (!d.testMeta || typeof d.testMeta !== 'object' || Array.isArray(d.testMeta)) {
        errors.push('Missing or invalid "testMeta" object.');
    } else {
        const meta = d.testMeta as Record<string, unknown>;
        if (!meta.title || typeof meta.title !== 'string' || !meta.title.trim()) errors.push('testMeta.title is required and must be a non-empty string.');
        if (typeof meta.durationMinutes !== 'number' || meta.durationMinutes < 1) errors.push('testMeta.durationMinutes must be a positive number.');
        if (typeof meta.totalMarks !== 'number' || meta.totalMarks < 1) errors.push('testMeta.totalMarks must be a positive number.');
        // batch and subject are selected via UI dropdowns — not required in JSON
        if (meta.negativeMarking !== undefined && typeof meta.negativeMarking !== 'number') errors.push('testMeta.negativeMarking must be a number if provided.');
        if (meta.resultMode !== undefined && !['instant', 'manual'].includes(meta.resultMode as string)) errors.push('testMeta.resultMode must be "instant" or "manual".');

    }

    // questions array
    if (!Array.isArray(d.questions) || d.questions.length === 0) {
        errors.push('questions[] array is required and must not be empty.');
    } else {
        const questionIds = new Set<string>();
        (d.questions as unknown[]).forEach((q: unknown, idx: number) => {
            if (typeof q !== 'object' || q === null) { errors.push(`Question at index ${idx} is not a valid object.`); return; }
            const qObj = q as Record<string, unknown>;
            const qLabel = `Question[${idx}] (questionId: ${qObj.questionId ?? 'MISSING'})`;

            if (!qObj.questionId || typeof qObj.questionId !== 'string') {
                errors.push(`${qLabel}: questionId is required and must be a string.`);
            } else if (questionIds.has(qObj.questionId as string)) {
                errors.push(`${qLabel}: Duplicate questionId "${qObj.questionId}".`);
            } else {
                questionIds.add(qObj.questionId as string);
            }

            if (!qObj.questionText || typeof qObj.questionText !== 'string' || !(qObj.questionText as string).trim()) errors.push(`${qLabel}: questionText is required.`);
            if (typeof qObj.marks !== 'number' || (qObj.marks as number) < 0) errors.push(`${qLabel}: marks must be a non-negative number.`);
            if (qObj.type !== 'mcq') errors.push(`${qLabel}: type must be "mcq".`);

            // Options validation
            if (!Array.isArray(qObj.options) || (qObj.options as unknown[]).length !== 4) {
                errors.push(`${qLabel}: options[] must contain exactly 4 items.`);
            } else {
                const requiredLabels = ['A', 'B', 'C', 'D'];
                const foundLabels = (qObj.options as Record<string, unknown>[]).map(o => o.label);
                requiredLabels.forEach(label => {
                    if (!foundLabels.includes(label)) errors.push(`${qLabel}: Missing option with label "${label}".`);
                });
                (qObj.options as Record<string, unknown>[]).forEach((o, oi) => {
                    if (!o.text || typeof o.text !== 'string' || !(o.text as string).trim()) {
                        errors.push(`${qLabel}: Option[${oi}] text is empty.`);
                    }
                });
            }
        });
    }

    return { valid: errors.length === 0, errors, warnings };
}

// ── Validate answers.json ──────────────────────────────────────────────────
export function validateAnswersFile(
    data: unknown,
    questionIds: string[],
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { valid: false, errors: ['answers.json must be a JSON object.'], warnings };
    }

    const d = data as Record<string, unknown>;
    if (!d.testTitle || typeof d.testTitle !== 'string') errors.push('answers.json: testTitle is required.');

    if (!Array.isArray(d.answers) || d.answers.length === 0) {
        errors.push('answers[]: required and must not be empty.');
    } else {
        const answeredIds = new Set<string>();
        (d.answers as unknown[]).forEach((a: unknown, idx: number) => {
            if (typeof a !== 'object' || a === null) { errors.push(`Answer at index ${idx} is not valid.`); return; }
            const aObj = a as Record<string, unknown>;
            const aLabel = `Answer[${idx}] (questionId: ${aObj.questionId ?? 'MISSING'})`;

            if (!aObj.questionId || typeof aObj.questionId !== 'string') {
                errors.push(`${aLabel}: questionId is required.`);
            } else {
                if (!questionIds.includes(aObj.questionId as string)) {
                    errors.push(`${aLabel}: questionId "${aObj.questionId}" does not exist in questions.json.`);
                }
                if (answeredIds.has(aObj.questionId as string)) {
                    errors.push(`${aLabel}: Duplicate questionId in answers.`);
                } else {
                    answeredIds.add(aObj.questionId as string);
                }
            }

            if (!aObj.correctAnswer || !['A', 'B', 'C', 'D'].includes((aObj.correctAnswer as string)?.toUpperCase())) {
                errors.push(`${aLabel}: correctAnswer must be one of A, B, C, D.`);
            }
        });

        // Warn if not all questions have answers
        const answeredArr = Array.from(answeredIds);
        questionIds.forEach(qId => {
            if (!answeredArr.includes(qId)) warnings.push(`No answer provided for questionId "${qId}" — it will be treated as unscored.`);
        });
    }

    return { valid: errors.length === 0, errors, warnings };
}
