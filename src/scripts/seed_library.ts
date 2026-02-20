import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });

// Load schemas dynamically to avoid Next.js module conflicts in standalone node
const ProgramSchema = new mongoose.Schema({ name: String, code: String, course_type: String });
const CategorySchema = new mongoose.Schema({ name: String, semester_or_module: Number });
const DocumentSchema = new mongoose.Schema({
    course_id: mongoose.Schema.Types.ObjectId,
    category_id: mongoose.Schema.Types.ObjectId,
    title: String,
    content: String,
    file_type: String,
    current_version: Number,
    is_common: Boolean,
    is_deleted: Boolean
}, { timestamps: true });

const Program = mongoose.models.Program || mongoose.model('Program', ProgramSchema);
const LibraryCategory = mongoose.models.LibraryCategory || mongoose.model('LibraryCategory', CategorySchema);
const LibraryDocument = mongoose.models.LibraryDocument || mongoose.model('LibraryDocument', DocumentSchema);

async function seedLibrary() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to DB');

    // Ensure Master Category exists
    let syllabusCategory = await LibraryCategory.findOne({ name: 'Master Curriculum & Syllabus' });
    if (!syllabusCategory) {
        syllabusCategory = await LibraryCategory.create({ name: 'Master Curriculum & Syllabus' });
    }

    const seedsDir = path.join(__dirname, 'library_seeds');
    if (!fs.existsSync(seedsDir)) {
        console.log('No seeds directory found. Create src/scripts/library_seeds/');
        process.exit(0);
    }

    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        console.log(`Processing seed file: ${file}`);
        const data = JSON.parse(fs.readFileSync(path.join(seedsDir, file), 'utf-8'));

        for (const courseData of data) {
            // Find existing program to link
            const programCode = courseData.course_name.split(':')[0].trim();
            const program = await Program.findOne({ code: programCode });

            if (!program) {
                console.warn(`⚠️ Warning: Program ${programCode} not found in DB. Skipping.`);
                continue;
            }

            // Check if document already exists
            const existingDoc = await LibraryDocument.findOne({
                course_id: program._id,
                title: `${programCode} - Master Curriculum`
            });

            if (existingDoc) {
                console.log(`⏩ Skipping ${programCode} (Already seeded)`);
                continue;
            }

            await LibraryDocument.create({
                course_id: program._id,
                category_id: syllabusCategory._id,
                title: `${programCode} - Master Curriculum`,
                content: courseData.html_content, // Inject our rich HTML here
                file_type: 'rich-text',
                current_version: 1,
                is_common: false,
                is_deleted: false
            });
            console.log(`✅ Seeded curriculum for ${programCode}`);
        }
    }

    console.log('🎉 Seeding Complete!');
    process.exit(0);
}

seedLibrary().catch(console.error);
