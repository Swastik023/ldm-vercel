/**
 * seed_curriculum.js
 * ─────────────────────────────────────────────────────────
 * Reads the rich curriculum JSON files from ai_output/diploma/
 * and ai_output/certificate/ and upserts curriculum data into
 * the Program collection in MongoDB.
 *
 * Usage:
 *   node scripts/seed_curriculum.js
 *
 * It does NOT delete any data. It only enriches existing Programs.
 * ─────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ── Simplified Program Schema (matching the app's schema) ────────────────
const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    duration_years: { type: Number, required: true },
    total_semesters: { type: Number, required: true },
    course_type: { type: String, default: 'diploma' },
    is_active: { type: Boolean, default: true },
    shortDescription: { type: String, default: '' },
    image: { type: String, default: '' },
    eligibilitySummary: { type: String, default: '' },
    syllabus: [{ type: String }],
    careerOptions: [{ type: String }],
    displayOrder: { type: Number, default: 0 },
    pricing: { type: mongoose.Schema.Types.Mixed, default: {} },
    curriculum: { type: mongoose.Schema.Types.Mixed, default: undefined },
}, { timestamps: true, strict: false });

const Program = mongoose.models.Program || mongoose.model('Program', ProgramSchema);

// ── Code Aliases ─────────────────────────────────────────────────────────
// Map JSON program_code → actual DB code (for mismatches)
const CODE_ALIASES = {
    'dcp': 'dccp',      // Diploma in Community Care Provider
    'dhcp': 'dihcp',    // Diploma in Home Care Provider
    'dhsi': 'dshi',     // Diploma in Health & Sanitary Inspector
};

// ── Helpers ──────────────────────────────────────────────────────────────
function buildCurriculum(json) {
    return {
        overview: json.overview || undefined,
        academic_structure: json.academic_structure || undefined,
        detailed_syllabus: json.detailed_syllabus || undefined,
        practical_procedures: json.practical_procedures || undefined,
        case_scenarios: json.case_scenarios_workflows || json.case_scenarios || undefined,
        internship: json.internship_details || json.internship || undefined,
        assessment: json.assessment_methodology || json.assessment || undefined,
        career_pathways: json.career_pathways || undefined,
        student_engagement: json.student_engagement || undefined,
        medical_accuracy_verification: json.medical_accuracy_verification || undefined,
    };
}

function extractDescription(json) {
    if (json.overview) {
        const key = Object.keys(json.overview)[0];
        if (key && json.overview[key]) {
            return json.overview[key].slice(0, 600);
        }
    }
    return null;
}

function extractSyllabus(json) {
    if (!json.detailed_syllabus) return null;
    const topics = [];
    for (const sem of json.detailed_syllabus) {
        if (sem.units) {
            for (const unit of sem.units) {
                topics.push(unit.title);
            }
        }
    }
    return topics.length > 0 ? topics : null;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function seedCurriculum() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI is not set. Check .env or .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const dirs = [
            path.resolve(__dirname, '../ai_output/diploma'),
            path.resolve(__dirname, '../ai_output/certificate'),
        ];

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                console.log(`⏭️  Directory not found, skipping: ${dir}`);
                continue;
            }

            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
            console.log(`📁 Processing ${files.length} files from ${path.basename(dir)}/\n`);

            for (const file of files) {
                const filePath = path.join(dir, file);
                try {
                    const raw = fs.readFileSync(filePath, 'utf-8');
                    if (!raw.trim()) {
                        console.log(`  ⏭️  ${file} — empty file, skipping`);
                        skipped++;
                        continue;
                    }

                    const json = JSON.parse(raw);
                    const rawCode = (json.program_code || file.replace('.json', '')).toLowerCase();
                    const code = CODE_ALIASES[rawCode] || rawCode;

                    // Find matching program by code
                    const program = await Program.findOne({
                        code: { $regex: new RegExp(`^${code}$`, 'i') }
                    });

                    if (!program) {
                        console.log(`  ⚠️  ${file} — no Program found with code "${code}", skipping`);
                        skipped++;
                        continue;
                    }

                    // Build update object
                    const updateFields = {
                        curriculum: buildCurriculum(json),
                    };

                    // Also update basic fields if they're currently sparse
                    const newDesc = extractDescription(json);
                    if (newDesc && (!program.description || program.description.length < 100)) {
                        updateFields.description = newDesc;
                        updateFields.shortDescription = newDesc.slice(0, 250);
                    }

                    const newSyllabus = extractSyllabus(json);
                    if (newSyllabus && (!program.syllabus || program.syllabus.length < 4)) {
                        updateFields.syllabus = newSyllabus;
                    }

                    if (json.career_pathways && (!program.careerOptions || program.careerOptions.length < 4)) {
                        updateFields.careerOptions = json.career_pathways;
                    }

                    // Update course_type from JSON if available
                    if (json.course_type) {
                        updateFields.course_type = json.course_type;
                    }

                    await Program.findByIdAndUpdate(program._id, { $set: updateFields });
                    console.log(`  ✅ ${file} → updated "${program.name}" (code: ${program.code})`);
                    updated++;

                } catch (err) {
                    console.error(`  ❌ ${file} — Error: ${err.message}`);
                    errors++;
                }
            }
            console.log('');
        }

        console.log('═══════════════════════════════════════════');
        console.log(`📊 Results: ${updated} updated, ${skipped} skipped, ${errors} errors`);
        console.log('═══════════════════════════════════════════');

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

seedCurriculum();
