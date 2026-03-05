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

// ── Combined single-JSON format types ──────────────────────────────────────

export interface CombinedQuestion {
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctOption: 'A' | 'B' | 'C' | 'D';
    reason?: string;
    marks: number;
    sectionId?: string;
}

export interface CombinedTestFile {
    testTitle: string;
    description?: string;
    academicYear?: string;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    resultMode?: 'instant' | 'manual';
    sections?: UploadedSection[];
    questions: CombinedQuestion[];
}

// ── Validate combined single-JSON file ─────────────────────────────────────
export function validateCombinedFile(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { valid: false, errors: ['JSON must be a valid object.'], warnings };
    }

    const d = data as Record<string, unknown>;

    // Root-level metadata
    if (!d.testTitle || typeof d.testTitle !== 'string' || !(d.testTitle as string).trim()) {
        errors.push('testTitle is required and must be a non-empty string.');
    }
    if (typeof d.durationMinutes !== 'number' || d.durationMinutes < 1) {
        errors.push('durationMinutes must be a positive number.');
    }
    if (typeof d.totalMarks !== 'number' || d.totalMarks < 1) {
        errors.push('totalMarks must be a positive number.');
    }
    if (d.negativeMarking !== undefined && typeof d.negativeMarking !== 'number') {
        errors.push('negativeMarking must be a number if provided.');
    }
    if (d.resultMode !== undefined && !['instant', 'manual'].includes(d.resultMode as string)) {
        errors.push('resultMode must be "instant" or "manual".');
    }
    if (d.academicYear !== undefined && (typeof d.academicYear !== 'string' || !/^\d{4}-\d{2}$/.test(d.academicYear as string))) {
        warnings.push('academicYear should follow format "YYYY-YY" (e.g., "2025-26").');
    }

    // Questions array
    if (!Array.isArray(d.questions) || d.questions.length === 0) {
        errors.push('questions[] array is required and must not be empty.');
    } else {
        let marksSum = 0;
        (d.questions as unknown[]).forEach((q: unknown, idx: number) => {
            if (typeof q !== 'object' || q === null) { errors.push(`Question[${idx}] is not a valid object.`); return; }
            const qObj = q as Record<string, unknown>;
            const qLabel = `Question[${idx}]`;

            if (!qObj.question || typeof qObj.question !== 'string' || !(qObj.question as string).trim()) {
                errors.push(`${qLabel}: "question" field is required.`);
            }
            if (typeof qObj.marks !== 'number' || (qObj.marks as number) <= 0) {
                errors.push(`${qLabel}: marks must be a positive number.`);
            } else {
                marksSum += qObj.marks as number;
            }

            // Options: must be object with exactly A, B, C, D keys
            if (!qObj.options || typeof qObj.options !== 'object' || Array.isArray(qObj.options)) {
                errors.push(`${qLabel}: options must be an object with keys A, B, C, D.`);
            } else {
                const opts = qObj.options as Record<string, unknown>;
                ['A', 'B', 'C', 'D'].forEach(key => {
                    if (!opts[key] || typeof opts[key] !== 'string' || !(opts[key] as string).trim()) {
                        errors.push(`${qLabel}: options.${key} is required and must be a non-empty string.`);
                    }
                });
            }

            // Correct option
            if (!qObj.correctOption || !['A', 'B', 'C', 'D'].includes((qObj.correctOption as string)?.toUpperCase())) {
                errors.push(`${qLabel}: correctOption must be one of A, B, C, D.`);
            }
        });

        // Warn if marks sum doesn't match totalMarks
        if (typeof d.totalMarks === 'number' && marksSum !== d.totalMarks) {
            warnings.push(`Sum of question marks (${marksSum}) does not match totalMarks (${d.totalMarks}).`);
        }
    }

    return { valid: errors.length === 0, errors, warnings };
}
